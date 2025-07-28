import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth, requireRole, generateToken, comparePassword, hashPassword, type AuthenticatedRequest } from "./auth";
import { insertUserSchema, insertQuestionSchema, insertAnswerSchema, insertFeedbackSchema } from "@shared/schema";
import { z } from "zod";

// Login schema
const loginSchema = z.object({
  tcNumber: z.string().length(11, "T.C. Kimlik Numarası 11 haneli olmalıdır"),
  password: z.string().min(1, "Şifre gereklidir"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { tcNumber, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByTcNumber(tcNumber);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Log activity
      await storage.logActivity({
        userId: user.id,
        action: 'login',
        details: 'Kullanıcı sisteme giriş yaptı',
        ipAddress: req.ip,
      });

      const token = generateToken(user);
      
      res.json({ 
        token, 
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tableNumber: user.tableNumber,
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: 'Giriş bilgileri geçersiz' });
    }
  });

  app.post('/api/auth/logout', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user) {
        await storage.logActivity({
          userId: req.user.id,
          action: 'logout',
          details: 'Kullanıcı sistemden çıkış yaptı',
          ipAddress: req.ip,
        });
      }
      res.json({ message: 'Çıkış başarılı' });
    } catch (error) {
      res.status(500).json({ message: 'Çıkış hatası' });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      }
      
      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tableNumber: user.tableNumber,
      });
    } catch (error) {
      res.status(500).json({ message: 'Kullanıcı bilgileri alınamadı' });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'İstatistikler alınamadı' });
    }
  });

  // User management routes (adminpro only)
  app.get('/api/users', requireAuth, requireRole(['adminpro']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Kullanıcılar alınamadı' });
    }
  });

  app.post('/api/users', requireAuth, requireRole(['adminpro']), async (req: AuthenticatedRequest, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Hash password
      userData.password = await hashPassword(userData.password);
      
      const user = await storage.createUser(userData);
      
      // Log activity
      await storage.logActivity({
        userId: req.user!.id,
        action: 'create_user',
        details: `Yeni kullanıcı oluşturuldu: ${user.firstName} ${user.lastName}`,
        metadata: { createdUserId: user.id },
        ipAddress: req.ip,
      });
      
      res.status(201).json(user);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(400).json({ message: 'Kullanıcı oluşturulamadı' });
    }
  });

  // Question management routes
  app.get('/api/questions', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      let questions;
      
      if (req.user!.role === 'moderator' && req.user!.tableNumber) {
        // Moderators only see questions assigned to their table
        questions = await storage.getQuestionsForTable(req.user!.tableNumber);
      } else {
        // Admins see all questions
        questions = await storage.getAllQuestions();
      }
      
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: 'Sorular alınamadı' });
    }
  });

  app.post('/api/questions', requireAuth, requireRole(['adminpro']), async (req: AuthenticatedRequest, res) => {
    try {
      const questionData = insertQuestionSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      
      const question = await storage.createQuestion(questionData);
      
      // Log activity
      await storage.logActivity({
        userId: req.user!.id,
        action: 'create_question',
        details: `Yeni soru oluşturuldu: ${question.text.substring(0, 50)}...`,
        metadata: { questionId: question.id },
        ipAddress: req.ip,
      });
      
      res.status(201).json(question);
    } catch (error) {
      console.error('Create question error:', error);
      res.status(400).json({ message: 'Soru oluşturulamadı' });
    }
  });

  app.put('/api/questions/:id', requireAuth, requireRole(['adminpro']), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updates = insertQuestionSchema.partial().parse(req.body);
      
      const question = await storage.updateQuestion(id, updates);
      
      // Log activity
      await storage.logActivity({
        userId: req.user!.id,
        action: 'edit_question',
        details: `Soru güncellendi: ${question.text.substring(0, 50)}...`,
        metadata: { questionId: question.id },
        ipAddress: req.ip,
      });
      
      res.json(question);
    } catch (error) {
      res.status(400).json({ message: 'Soru güncellenemedi' });
    }
  });

  app.delete('/api/questions/:id', requireAuth, requireRole(['adminpro']), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      const question = await storage.getQuestion(id);
      if (!question) {
        return res.status(404).json({ message: 'Soru bulunamadı' });
      }
      
      await storage.deleteQuestion(id);
      
      // Log activity
      await storage.logActivity({
        userId: req.user!.id,
        action: 'delete_question',
        details: `Soru silindi: ${question.text.substring(0, 50)}...`,
        metadata: { questionId: id },
        ipAddress: req.ip,
      });
      
      res.json({ message: 'Soru silindi' });
    } catch (error) {
      res.status(500).json({ message: 'Soru silinemedi' });
    }
  });

  // Answer routes
  app.get('/api/questions/:questionId/answers', requireAuth, async (req, res) => {
    try {
      const { questionId } = req.params;
      const answers = await storage.getAnswersForQuestion(questionId);
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: 'Cevaplar alınamadı' });
    }
  });

  app.get('/api/answers/my', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const answers = await storage.getAnswersForUser(req.user!.id);
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: 'Cevaplar alınamadı' });
    }
  });

  app.get('/api/answers', requireAuth, requireRole(['admin', 'adminpro']), async (req, res) => {
    try {
      const answers = await storage.getAllAnswers();
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: 'Cevaplar alınamadı' });
    }
  });

  app.post('/api/answers', requireAuth, requireRole(['moderator']), async (req: AuthenticatedRequest, res) => {
    try {
      const answerData = insertAnswerSchema.parse({
        ...req.body,
        userId: req.user!.id,
        tableNumber: req.user!.tableNumber,
      });
      
      const answer = await storage.createAnswer(answerData);
      
      // Log activity
      await storage.logActivity({
        userId: req.user!.id,
        action: 'create_answer',
        details: `Yeni cevap eklendi`,
        metadata: { questionId: answer.questionId, answerId: answer.id },
        ipAddress: req.ip,
      });
      
      res.status(201).json(answer);
    } catch (error) {
      console.error('Create answer error:', error);
      res.status(400).json({ message: 'Cevap eklenemedi' });
    }
  });

  app.put('/api/answers/:id', requireAuth, requireRole(['moderator']), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updates = insertAnswerSchema.partial().parse(req.body);
      
      const answer = await storage.updateAnswer(id, updates);
      
      // Log activity
      await storage.logActivity({
        userId: req.user!.id,
        action: 'edit_answer',
        details: `Cevap güncellendi`,
        metadata: { questionId: answer.questionId, answerId: answer.id },
        ipAddress: req.ip,
      });
      
      res.json(answer);
    } catch (error) {
      res.status(400).json({ message: 'Cevap güncellenemedi' });
    }
  });

  app.delete('/api/answers/:id', requireAuth, requireRole(['moderator']), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteAnswer(id);
      
      // Log activity
      await storage.logActivity({
        userId: req.user!.id,
        action: 'delete_answer',
        details: `Cevap silindi`,
        metadata: { answerId: id },
        ipAddress: req.ip,
      });
      
      res.json({ message: 'Cevap silindi' });
    } catch (error) {
      res.status(500).json({ message: 'Cevap silinemedi' });
    }
  });

  // Feedback routes
  app.get('/api/feedback', requireAuth, requireRole(['adminpro']), async (req, res) => {
    try {
      const feedbackItems = await storage.getAllFeedback();
      res.json(feedbackItems);
    } catch (error) {
      res.status(500).json({ message: 'Geri bildirimler alınamadı' });
    }
  });

  app.post('/api/feedback', requireAuth, requireRole(['moderator']), async (req: AuthenticatedRequest, res) => {
    try {
      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const feedbackItem = await storage.createFeedback(feedbackData);
      
      // Log activity
      await storage.logActivity({
        userId: req.user!.id,
        action: 'send_feedback',
        details: `Geri bildirim gönderildi`,
        metadata: { questionId: feedbackData.questionId, feedbackId: feedbackItem.id },
        ipAddress: req.ip,
      });
      
      res.status(201).json(feedbackItem);
    } catch (error) {
      res.status(400).json({ message: 'Geri bildirim gönderilemedi' });
    }
  });

  app.put('/api/feedback/:id/read', requireAuth, requireRole(['adminpro']), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markFeedbackAsRead(id);
      res.json({ message: 'Geri bildirim okundu olarak işaretlendi' });
    } catch (error) {
      res.status(500).json({ message: 'İşlem gerçekleştirilemedi' });
    }
  });

  app.put('/api/feedback/:id/resolve', requireAuth, requireRole(['adminpro']), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markFeedbackAsResolved(id);
      res.json({ message: 'Geri bildirim çözüldü olarak işaretlendi' });
    } catch (error) {
      res.status(500).json({ message: 'İşlem gerçekleştirilemedi' });
    }
  });

  // Activity logs
  app.get('/api/logs', requireAuth, requireRole(['admin', 'adminpro']), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Loglar alınamadı' });
    }
  });

  // Tables
  app.get('/api/tables', requireAuth, async (req, res) => {
    try {
      const tablesList = await storage.getAllTables();
      res.json(tablesList);
    } catch (error) {
      res.status(500).json({ message: 'Masalar alınamadı' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

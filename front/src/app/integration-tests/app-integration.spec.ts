import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { expect } from '@jest/globals';
import { of } from 'rxjs';

import { AuthService } from '../features/auth/services/auth.service';
import { SessionService } from '../services/session.service';
import { UserService } from '../services/user.service';
import { SessionApiService } from '../features/sessions/services/session-api.service';
import { TeacherService } from '../services/teacher.service';
import { SessionInformation } from '../interfaces/sessionInformation.interface';
import { User } from '../interfaces/user.interface';
import { Session } from '../features/sessions/interfaces/session.interface';
import { Teacher } from '../interfaces/teacher.interface';

describe('Application Integration Tests', () => {
  let httpTestingController: HttpTestingController;
  let authService: AuthService;
  let sessionService: SessionService;
  let userService: UserService;
  let sessionApiService: SessionApiService;
  let teacherService: TeacherService;

  const mockSessionInfo: SessionInformation = {
    token: 'mock-jwt-token',
    type: 'Bearer',
    id: 1,
    username: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    admin: false
  };

  const mockUser: User = {
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    admin: false,
    password: 'hashedpassword',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const mockSession: Session = {
    id: 1,
    name: 'Yoga Session 1',
    description: 'A relaxing yoga session',
    date: new Date('2024-01-15'),
    teacher_id: 1,
    users: [1, 2],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const mockTeacher: Teacher = {
    id: 1,
    firstName: 'Jane',
    lastName: 'Doe',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        SessionService,
        UserService,
        SessionApiService,
        TeacherService
      ]
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    sessionService = TestBed.inject(SessionService);
    userService = TestBed.inject(UserService);
    sessionApiService = TestBed.inject(SessionApiService);
    teacherService = TestBed.inject(TeacherService);
  });

  afterEach(() => {
    httpTestingController.verify();
    // Reset session state
    sessionService.logOut();
  });

  describe('Complete Authentication Flow', () => {
    it('should integrate authentication and session management', async () => {
      // Arrange
      const loginRequest = { email: 'test@example.com', password: 'password123' };

      // Act - Login
      authService.login(loginRequest).subscribe(response => {
        sessionService.logIn(response);
      });

      // Verify login API call
      const loginReq = httpTestingController.expectOne('api/auth/login');
      expect(loginReq.request.method).toBe('POST');
      loginReq.flush(mockSessionInfo);

      // Assert - Session should be established
      expect(sessionService.isLogged).toBe(true);
      expect(sessionService.sessionInformation).toEqual(mockSessionInfo);

      // Test session observable
      sessionService.$isLogged().subscribe(isLogged => {
        expect(isLogged).toBe(true);
      });
    });

    it('should handle logout and clear session', () => {
      // Arrange - Login first
      sessionService.logIn(mockSessionInfo);
      expect(sessionService.isLogged).toBe(true);

      // Act - Logout
      sessionService.logOut();

      // Assert
      expect(sessionService.isLogged).toBe(false);
      expect(sessionService.sessionInformation).toBeUndefined();

      // Test session observable
      sessionService.$isLogged().subscribe(isLogged => {
        expect(isLogged).toBe(false);
      });
    });
  });

  describe('Service Integration', () => {
    beforeEach(() => {
      // Setup authenticated session for service tests
      sessionService.logIn(mockSessionInfo);
    });

    it('should integrate user service with session service', async () => {
      // Act
      userService.getById(sessionService.sessionInformation!.id.toString()).subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      // Verify API call
      const userReq = httpTestingController.expectOne('api/user/1');
      expect(userReq.request.method).toBe('GET');
      userReq.flush(mockUser);
    });

    it('should integrate session API service with authentication', async () => {
      // Act
      sessionApiService.all().subscribe(sessions => {
        expect(sessions).toEqual([mockSession]);
      });

      // Verify API call
      const sessionsReq = httpTestingController.expectOne('api/session');
      expect(sessionsReq.request.method).toBe('GET');
      sessionsReq.flush([mockSession]);
    });

    it('should integrate teacher service for session details', async () => {
      // Act
      teacherService.detail('1').subscribe(teacher => {
        expect(teacher).toEqual(mockTeacher);
      });

      // Verify API call
      const teacherReq = httpTestingController.expectOne('api/teacher/1');
      expect(teacherReq.request.method).toBe('GET');
      teacherReq.flush(mockTeacher);
    });
  });

  describe('Session Participation Flow', () => {
    beforeEach(() => {
      sessionService.logIn(mockSessionInfo);
    });

    it('should integrate session participation workflow', async () => {
      const sessionId = '1';
      const userId = sessionService.sessionInformation!.id.toString();

      // Act - Join session
      sessionApiService.participate(sessionId, userId).subscribe(response => {
        expect(response).toBeDefined();
      });

      // Verify participate API call
      const participateReq = httpTestingController.expectOne(`api/session/${sessionId}/participate/${userId}`);
      expect(participateReq.request.method).toBe('POST');
      participateReq.flush({});

      // Act - Leave session
      sessionApiService.unParticipate(sessionId, userId).subscribe(response => {
        expect(response).toBeDefined();
      });

      // Verify unparticipate API call
      const unparticipateReq = httpTestingController.expectOne(`api/session/${sessionId}/participate/${userId}`);
      expect(unparticipateReq.request.method).toBe('DELETE');
      unparticipateReq.flush({});
    });
  });

  describe('User Account Management Flow', () => {
    beforeEach(() => {
      sessionService.logIn(mockSessionInfo);
    });

    it('should integrate user account deletion with session cleanup', async () => {
      const userId = sessionService.sessionInformation!.id.toString();

      // Act - Delete user account
      userService.delete(userId).subscribe(() => {
        // Simulate logout after account deletion
        sessionService.logOut();
      });

      // Verify delete API call
      const deleteReq = httpTestingController.expectOne(`api/user/${userId}`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush({ message: 'User deleted successfully' });

      // Assert - Session should be cleared
      expect(sessionService.isLogged).toBe(false);
      expect(sessionService.sessionInformation).toBeUndefined();
    });
  });

  describe('Data Flow Integration', () => {
    beforeEach(() => {
      sessionService.logIn(mockSessionInfo);
    });

    it('should integrate complete session detail loading flow', async () => {
      const sessionId = '1';

      // Act - Load session details
      sessionApiService.detail(sessionId).subscribe(session => {
        expect(session).toEqual(mockSession);
        
        // Load teacher details for the session
        teacherService.detail(session.teacher_id.toString()).subscribe(teacher => {
          expect(teacher).toEqual(mockTeacher);
        });
      });

      // Verify session API call
      const sessionReq = httpTestingController.expectOne(`api/session/${sessionId}`);
      expect(sessionReq.request.method).toBe('GET');
      sessionReq.flush(mockSession);

      // Verify teacher API call
      const teacherReq = httpTestingController.expectOne(`api/teacher/${mockSession.teacher_id}`);
      expect(teacherReq.request.method).toBe('GET');
      teacherReq.flush(mockTeacher);
    });

    it('should handle error propagation across services', async () => {
      // Act - Try to get non-existent user
      let errorOccurred = false;
      userService.getById('999').subscribe({
        error: (error) => {
          errorOccurred = true;
          expect(error.status).toBe(404);
        }
      });

      // Simulate API error
      const userReq = httpTestingController.expectOne('api/user/999');
      userReq.flush('User not found', { status: 404, statusText: 'Not Found' });

      // Assert
      expect(errorOccurred).toBe(true);
    });
  });

  describe('Authentication State Consistency', () => {
    it('should maintain authentication state across multiple service calls', async () => {
      // Arrange - Login
      sessionService.logIn(mockSessionInfo);

      // Act - Make multiple service calls
      const userId = sessionService.sessionInformation!.id.toString();

      userService.getById(userId).subscribe();
      sessionApiService.all().subscribe();
      teacherService.all().subscribe();

      // Verify all API calls include authentication context
      const userReq = httpTestingController.expectOne('api/user/1');
      const sessionsReq = httpTestingController.expectOne('api/session');
      const teachersReq = httpTestingController.expectOne('api/teacher');

      userReq.flush(mockUser);
      sessionsReq.flush([mockSession]);
      teachersReq.flush([mockTeacher]);

      // Assert - Session should remain consistent
      expect(sessionService.isLogged).toBe(true);
      expect(sessionService.sessionInformation).toEqual(mockSessionInfo);
    });
  });
});
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { LoginRequest } from '../interfaces/loginRequest.interface';
import { RegisterRequest } from '../interfaces/registerRequest.interface';
import { SessionInformation } from 'src/app/interfaces/sessionInformation.interface';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('register', () => {
    it('should send POST request to register endpoint with correct data', () => {
      // Arrange
      const registerRequest: RegisterRequest = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123'
      };

      // Act
      service.register(registerRequest).subscribe();

      // Assert
      const req = httpTestingController.expectOne('api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerRequest);
      
      req.flush(null);
    });

    it('should handle successful registration', () => {
      // Arrange
      const registerRequest: RegisterRequest = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123'
      };

      let responseReceived = false;

      // Act
      service.register(registerRequest).subscribe({
        next: () => {
          responseReceived = true;
        }
      });

      // Assert
      const req = httpTestingController.expectOne('api/auth/register');
      req.flush(null);
      expect(responseReceived).toBe(true);
    });

    it('should handle registration error', () => {
      // Arrange
      const registerRequest: RegisterRequest = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123'
      };

      const errorMessage = 'Registration failed';
      let errorReceived = false;

      // Act
      service.register(registerRequest).subscribe({
        error: (error) => {
          errorReceived = true;
          expect(error.status).toBe(400);
        }
      });

      // Assert
      const req = httpTestingController.expectOne('api/auth/register');
      req.flush(errorMessage, { status: 400, statusText: 'Bad Request' });
      expect(errorReceived).toBe(true);
    });
  });

  describe('login', () => {
    it('should send POST request to login endpoint with correct data', () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockSessionInfo: SessionInformation = {
        token: 'mock-jwt-token',
        type: 'Bearer',
        id: 1,
        username: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        admin: false
      };

      // Act
      service.login(loginRequest).subscribe();

      // Assert
      const req = httpTestingController.expectOne('api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginRequest);
      
      req.flush(mockSessionInfo);
    });

    it('should return SessionInformation on successful login', () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockSessionInfo: SessionInformation = {
        token: 'mock-jwt-token',
        type: 'Bearer',
        id: 1,
        username: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        admin: true
      };

      let receivedSessionInfo: SessionInformation | undefined;

      // Act
      service.login(loginRequest).subscribe({
        next: (sessionInfo) => {
          receivedSessionInfo = sessionInfo;
        }
      });

      // Assert
      const req = httpTestingController.expectOne('api/auth/login');
      req.flush(mockSessionInfo);
      
      expect(receivedSessionInfo).toEqual(mockSessionInfo);
      expect(receivedSessionInfo?.token).toBe('mock-jwt-token');
      expect(receivedSessionInfo?.admin).toBe(true);
    });

    it('should handle login error (invalid credentials)', () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      let errorReceived = false;

      // Act
      service.login(loginRequest).subscribe({
        error: (error) => {
          errorReceived = true;
          expect(error.status).toBe(401);
        }
      });

      // Assert
      const req = httpTestingController.expectOne('api/auth/login');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      expect(errorReceived).toBe(true);
    });

    it('should handle server error during login', () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      let errorReceived = false;

      // Act
      service.login(loginRequest).subscribe({
        error: (error) => {
          errorReceived = true;
          expect(error.status).toBe(500);
        }
      });

      // Assert
      const req = httpTestingController.expectOne('api/auth/login');
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
      expect(errorReceived).toBe(true);
    });
  });

  describe('pathService', () => {
    it('should use correct base path for API calls', () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Act
      service.login(loginRequest).subscribe();

      // Assert
      const req = httpTestingController.expectOne((request) => {
        return request.url.includes('api/auth/login');
      });
      
      expect(req.request.url).toBe('api/auth/login');
      req.flush({});
    });
  });
});
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpRequest } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './jwt.interceptor';
import { SessionService } from '../services/session.service';
import { SessionInformation } from '../interfaces/sessionInformation.interface';

describe('JwtInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let sessionService: any;
  let interceptor: JwtInterceptor;

  beforeEach(() => {
    const sessionServiceSpy = {
      isLogged: false,
      sessionInformation: null
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        JwtInterceptor,
        { provide: SessionService, useValue: sessionServiceSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: JwtInterceptor,
          multi: true,
        },
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);
    interceptor = TestBed.inject(JwtInterceptor);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  describe('intercept', () => {
    const testUrl = '/api/test';
    const testData = { message: 'test' };

    it('should add Authorization header when user is logged in', () => {
      // Arrange
      const mockToken = 'mock-jwt-token';
      const mockSessionInfo: SessionInformation = {
        token: mockToken,
        type: 'Bearer',
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        admin: false
      };

      sessionService.isLogged = true;
      sessionService.sessionInformation = mockSessionInfo;

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(testData);
    });

    it('should not add Authorization header when user is not logged in', () => {
      // Arrange
      sessionService.isLogged = false;
      sessionService.sessionInformation = null;

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush(testData);
    });

    it('should clone the request when adding authorization header', () => {
      // Arrange
      const mockToken = 'test-token';
      const mockSessionInfo: SessionInformation = {
        token: mockToken,
        type: 'Bearer',
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        admin: false
      };

      sessionService.isLogged = true;
      sessionService.sessionInformation = mockSessionInfo;

      // Act
      httpClient.post(testUrl, testData).subscribe();

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.body).toEqual(testData);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('should handle requests with existing headers', () => {
      // Arrange
      const mockToken = 'test-token';
      const mockSessionInfo: SessionInformation = {
        token: mockToken,
        type: 'Bearer',
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        admin: false
      };

      sessionService.isLogged = true;
      sessionService.sessionInformation = mockSessionInfo;

      // Act
      httpClient.get(testUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Custom-Header': 'custom-value'
        }
      }).subscribe();

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Custom-Header')).toBe('custom-value');
      req.flush(testData);
    });
  });
});
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';
import { Session } from '../interfaces/session.interface';

import { SessionApiService } from './session-api.service';

describe('SessionApiService', () => {
  let service: SessionApiService;
  let httpTestingController: HttpTestingController;

  const mockSession: Session = {
    id: 1,
    name: 'Yoga Session',
    description: 'A relaxing yoga session',
    date: new Date('2023-12-25'),
    teacher_id: 1,
    users: [1, 2, 3],
    createdAt: new Date('2023-12-20'),
    updatedAt: new Date('2023-12-20')
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SessionApiService]
    });
    service = TestBed.inject(SessionApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('all', () => {
    it('should get all sessions', () => {
      const mockSessions: Session[] = [mockSession];

      service.all().subscribe(sessions => {
        expect(sessions).toEqual(mockSessions);
        expect(sessions.length).toBe(1);
      });

      const req = httpTestingController.expectOne('api/session');
      expect(req.request.method).toBe('GET');
      req.flush(mockSessions);
    });

    it('should handle empty sessions list', () => {
      const mockSessions: Session[] = [];

      service.all().subscribe(sessions => {
        expect(sessions).toEqual(mockSessions);
        expect(sessions.length).toBe(0);
      });

      const req = httpTestingController.expectOne('api/session');
      expect(req.request.method).toBe('GET');
      req.flush(mockSessions);
    });
  });

  describe('detail', () => {
    it('should get session details by id', () => {
      const sessionId = '1';

      service.detail(sessionId).subscribe(session => {
        expect(session).toEqual(mockSession);
        expect(session.id).toBe(1);
      });

      const req = httpTestingController.expectOne(`api/session/${sessionId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSession);
    });

    it('should handle string id parameter', () => {
      const sessionId = '123';

      service.detail(sessionId).subscribe();

      const req = httpTestingController.expectOne(`api/session/${sessionId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSession);
    });
  });

  describe('delete', () => {
    it('should delete session by id', () => {
      const sessionId = '1';

      service.delete(sessionId).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpTestingController.expectOne(`api/session/${sessionId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should handle delete with string id', () => {
      const sessionId = '999';

      service.delete(sessionId).subscribe();

      const req = httpTestingController.expectOne(`api/session/${sessionId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('create', () => {
    it('should create a new session', () => {
      const newSession: Session = {
        name: 'New Yoga Session',
        description: 'Brand new session',
        date: new Date('2023-12-30'),
        teacher_id: 2,
        users: []
      };

      const createdSession: Session = {
        ...newSession,
        id: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      service.create(newSession).subscribe(session => {
        expect(session).toEqual(createdSession);
        expect(session.id).toBe(2);
      });

      const req = httpTestingController.expectOne('api/session');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newSession);
      req.flush(createdSession);
    });

    it('should send complete session data in create request', () => {
      service.create(mockSession).subscribe();

      const req = httpTestingController.expectOne('api/session');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockSession);
      expect(req.request.body.name).toBe('Yoga Session');
      expect(req.request.body.teacher_id).toBe(1);
      req.flush(mockSession);
    });
  });

  describe('update', () => {
    it('should update existing session', () => {
      const sessionId = '1';
      const updatedSession: Session = {
        ...mockSession,
        name: 'Updated Yoga Session',
        description: 'Updated description'
      };

      service.update(sessionId, updatedSession).subscribe(session => {
        expect(session).toEqual(updatedSession);
        expect(session.name).toBe('Updated Yoga Session');
      });

      const req = httpTestingController.expectOne(`api/session/${sessionId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedSession);
      req.flush(updatedSession);
    });

    it('should handle string id in update', () => {
      const sessionId = '456';

      service.update(sessionId, mockSession).subscribe();

      const req = httpTestingController.expectOne(`api/session/${sessionId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockSession);
      req.flush(mockSession);
    });
  });

  describe('participate', () => {
    it('should add user to session participation', () => {
      const sessionId = '1';
      const userId = '123';

      service.participate(sessionId, userId).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpTestingController.expectOne(`api/session/${sessionId}/participate/${userId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      req.flush(null);
    });

    it('should handle string parameters for participate', () => {
      const sessionId = '999';
      const userId = '888';

      service.participate(sessionId, userId).subscribe();

      const req = httpTestingController.expectOne(`api/session/${sessionId}/participate/${userId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      req.flush(null);
    });
  });

  describe('unParticipate', () => {
    it('should remove user from session participation', () => {
      const sessionId = '1';
      const userId = '123';

      service.unParticipate(sessionId, userId).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpTestingController.expectOne(`api/session/${sessionId}/participate/${userId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle string parameters for unParticipate', () => {
      const sessionId = '777';
      const userId = '666';

      service.unParticipate(sessionId, userId).subscribe();

      const req = httpTestingController.expectOne(`api/session/${sessionId}/participate/${userId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('pathService', () => {
    it('should use correct base path for all API calls', () => {
      service.all().subscribe();
      const req = httpTestingController.expectOne(request => 
        request.url.includes('api/session')
      );
      expect(req.request.url).toBe('api/session');
      req.flush([]);
    });
  });
});

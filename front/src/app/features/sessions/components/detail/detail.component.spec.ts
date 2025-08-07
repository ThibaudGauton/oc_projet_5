import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule, } from '@angular/router/testing';
import { expect } from '@jest/globals';
import { of } from 'rxjs';
import { SessionService } from '../../../../services/session.service';
import { TeacherService } from '../../../../services/teacher.service';
import { SessionApiService } from '../../services/session-api.service';
import { Session } from '../../interfaces/session.interface';
import { Teacher } from '../../../../interfaces/teacher.interface';

import { DetailComponent } from './detail.component';


describe('DetailComponent', () => {
  let component: DetailComponent;
  let fixture: ComponentFixture<DetailComponent>;
  let sessionService: SessionService;
  let sessionApiService: any;
  let teacherService: any;
  let router: any;
  let matSnackBar: any;
  let activatedRoute: any;

  const mockSession: Session = {
    id: 1,
    name: 'Test Session',
    description: 'Test Description',
    date: new Date('2023-01-01'),
    teacher_id: 1,
    users: [1, 2],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  const mockTeacher: Teacher = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  const mockSessionService = {
    sessionInformation: {
      admin: true,
      id: 1
    }
  };

  beforeEach(async () => {
    const sessionApiServiceSpy = {
      detail: jest.fn(),
      delete: jest.fn(),
      participate: jest.fn(),
      unParticipate: jest.fn()
    };

    const teacherServiceSpy = {
      detail: jest.fn()
    };

    const routerSpy = {
      navigate: jest.fn()
    };

    const matSnackBarSpy = {
      open: jest.fn()
    };

    const activatedRouteSpy = {
      snapshot: {
        paramMap: {
          get: jest.fn().mockReturnValue('1')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule,
        MatSnackBarModule,
        ReactiveFormsModule
      ],
      declarations: [DetailComponent],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: SessionApiService, useValue: sessionApiServiceSpy },
        { provide: TeacherService, useValue: teacherServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: matSnackBarSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ],
    })
      .compileComponents();

    sessionService = TestBed.inject(SessionService);
    sessionApiService = TestBed.inject(SessionApiService);
    teacherService = TestBed.inject(TeacherService);
    router = TestBed.inject(Router);
    matSnackBar = TestBed.inject(MatSnackBar);
    activatedRoute = TestBed.inject(ActivatedRoute);

    fixture = TestBed.createComponent(DetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize component properties in constructor', () => {
    expect(component.sessionId).toBe('1');
    expect(component.isAdmin).toBe(true);
    expect(component.userId).toBe('1');
  });

  describe('ngOnInit', () => {
    it('should call sessionApiService.detail on init', () => {
      // Arrange
      sessionApiService.detail.mockReturnValue(of(mockSession));
      teacherService.detail.mockReturnValue(of(mockTeacher));

      // Act
      component.ngOnInit();

      // Assert
      expect(sessionApiService.detail).toHaveBeenCalledWith('1');
    });
  });

  describe('back', () => {
    it('should call window.history.back', () => {
      // Arrange
      const historySpy = jest.spyOn(window.history, 'back');

      // Act
      component.back();

      // Assert
      expect(historySpy).toHaveBeenCalled();

      // Cleanup
      historySpy.mockRestore();
    });
  });

  describe('delete', () => {
    it('should delete session and show success message', () => {
      // Arrange
      sessionApiService.delete.mockReturnValue(of({}));

      // Act
      component.delete();

      // Assert
      expect(sessionApiService.delete).toHaveBeenCalledWith('1');
      expect(matSnackBar.open).toHaveBeenCalledWith('Session deleted !', 'Close', { duration: 3000 });
      expect(router.navigate).toHaveBeenCalledWith(['sessions']);
    });
  });

  describe('participate', () => {
    it('should call participate and refresh session', () => {
      // Arrange
      sessionApiService.participate.mockReturnValue(of({}));
      sessionApiService.detail.mockReturnValue(of(mockSession));
      teacherService.detail.mockReturnValue(of(mockTeacher));

      // Act
      component.participate();

      // Assert
      expect(sessionApiService.participate).toHaveBeenCalledWith('1', '1');
    });
  });

  describe('unParticipate', () => {
    it('should call unParticipate and refresh session', () => {
      // Arrange
      sessionApiService.unParticipate.mockReturnValue(of({}));
      sessionApiService.detail.mockReturnValue(of(mockSession));
      teacherService.detail.mockReturnValue(of(mockTeacher));

      // Act
      component.unParticipate();

      // Assert
      expect(sessionApiService.unParticipate).toHaveBeenCalledWith('1', '1');
    });
  });

  describe('session data fetching', () => {
    it('should fetch session and teacher details when ngOnInit is called', () => {
      // Arrange
      sessionApiService.detail.mockReturnValue(of(mockSession));
      teacherService.detail.mockReturnValue(of(mockTeacher));

      // Act
      component.ngOnInit();

      // Assert
      expect(sessionApiService.detail).toHaveBeenCalledWith('1');
      expect(teacherService.detail).toHaveBeenCalledWith('1');
    });

    it('should set session and teacher properties', () => {
      // Arrange
      sessionApiService.detail.mockReturnValue(of(mockSession));
      teacherService.detail.mockReturnValue(of(mockTeacher));

      // Act
      component.ngOnInit();

      // Assert
      setTimeout(() => {
        expect(component.session).toEqual(mockSession);
        expect(component.teacher).toEqual(mockTeacher);
      }, 0);
    });

    it('should set isParticipate to true when user is in session users', () => {
      // Arrange
      const sessionWithCurrentUser = { ...mockSession, users: [1, 2] };
      sessionApiService.detail.mockReturnValue(of(sessionWithCurrentUser));
      teacherService.detail.mockReturnValue(of(mockTeacher));

      // Act
      component.ngOnInit();

      // Assert
      setTimeout(() => {
        expect(component.isParticipate).toBe(true);
      }, 0);
    });

    it('should set isParticipate to false when user is not in session users', () => {
      // Arrange
      const sessionWithoutCurrentUser = { ...mockSession, users: [2, 3] };
      sessionApiService.detail.mockReturnValue(of(sessionWithoutCurrentUser));
      teacherService.detail.mockReturnValue(of(mockTeacher));

      // Act
      component.ngOnInit();

      // Assert
      setTimeout(() => {
        expect(component.isParticipate).toBe(false);
      }, 0);
    });
  });
});


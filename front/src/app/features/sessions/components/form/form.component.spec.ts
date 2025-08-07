import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { expect } from '@jest/globals';
import { of } from 'rxjs';
import { SessionService } from 'src/app/services/session.service';
import { TeacherService } from 'src/app/services/teacher.service';
import { Session } from '../../interfaces/session.interface';
import { SessionApiService } from '../../services/session-api.service';

import { FormComponent } from './form.component';

describe('FormComponent', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;
  let sessionService: any;
  let sessionApiService: any;
  let teacherService: any;
  let router: any;
  let activatedRoute: any;
  let matSnackBar: any;

  const mockSession: Session = {
    id: 1,
    name: 'Test Session',
    description: 'Test Description',
    date: new Date('2023-12-25'),
    teacher_id: 1,
    users: [1, 2]
  };

  const mockTeachers = [
    { id: 1, firstName: 'John', lastName: 'Doe' },
    { id: 2, firstName: 'Jane', lastName: 'Smith' }
  ];

  beforeEach(async () => {
    const sessionServiceSpy = {
      sessionInformation: {
        admin: true
      }
    };

    const sessionApiServiceSpy = {
      detail: jest.fn(() => of(mockSession)),
      create: jest.fn(() => of(mockSession)),
      update: jest.fn(() => of(mockSession))
    };

    const teacherServiceSpy = {
      all: jest.fn(() => of(mockTeachers))
    };

    const routerSpy = {
      navigate: jest.fn(),
      url: '/sessions/create'
    };

    const activatedRouteSpy = {
      snapshot: {
        paramMap: {
          get: jest.fn(() => '1')
        }
      }
    };

    const matSnackBarSpy = {
      open: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        MatCardModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule, 
        MatSnackBarModule,
        MatSelectModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: SessionService, useValue: sessionServiceSpy },
        { provide: SessionApiService, useValue: sessionApiServiceSpy },
        { provide: TeacherService, useValue: teacherServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: MatSnackBar, useValue: matSnackBarSpy }
      ],
      declarations: [FormComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    sessionService = TestBed.inject(SessionService);
    sessionApiService = TestBed.inject(SessionApiService);
    teacherService = TestBed.inject(TeacherService);
    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);
    matSnackBar = TestBed.inject(MatSnackBar);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should redirect non-admin users to sessions', () => {
      // Arrange
      sessionService.sessionInformation = { admin: false };
      
      // Act
      component.ngOnInit();

      // Assert
      expect(router.navigate).toHaveBeenCalledWith(['/sessions']);
    });

    it('should set onUpdate to true for update URL', () => {
      // Arrange
      router.url = '/sessions/update/1';
      sessionService.sessionInformation = { admin: true };

      // Act
      component.ngOnInit();

      // Assert
      expect(component.onUpdate).toBe(true);
      expect(sessionApiService.detail).toHaveBeenCalledWith('1');
    });

    it('should set onUpdate to false for create URL', () => {
      // Arrange
      router.url = '/sessions/create';
      sessionService.sessionInformation = { admin: true };

      // Act
      component.ngOnInit();

      // Assert
      expect(component.onUpdate).toBe(false);
      expect(sessionApiService.detail).not.toHaveBeenCalled();
    });

    it('should initialize form for create mode', () => {
      // Arrange
      router.url = '/sessions/create';
      sessionService.sessionInformation = { admin: true };

      // Act
      component.ngOnInit();

      // Assert
      expect(component.sessionForm).toBeDefined();
      expect(component.sessionForm?.get('name')?.value).toBe('');
      expect(component.sessionForm?.get('description')?.value).toBe('');
    });

    it('should initialize form with session data for update mode', () => {
      // Arrange
      router.url = '/sessions/update/1';
      sessionService.sessionInformation = { admin: true };

      // Act
      component.ngOnInit();

      // Assert
      expect(sessionApiService.detail).toHaveBeenCalledWith('1');
      expect(component.onUpdate).toBe(true);
    });
  });

  describe('submit', () => {
    beforeEach(() => {
      router.url = '/sessions/create';
      sessionService.sessionInformation = { admin: true };
      component.ngOnInit();
    });

    it('should create session when not in update mode', () => {
      // Arrange
      component.onUpdate = false;
      component.sessionForm?.patchValue({
        name: 'New Session',
        description: 'New Description',
        date: '2023-12-25',
        teacher_id: 1
      });

      // Act
      component.submit();

      // Assert
      expect(sessionApiService.create).toHaveBeenCalled();
      expect(matSnackBar.open).toHaveBeenCalledWith('Session created !', 'Close', { duration: 3000 });
      expect(router.navigate).toHaveBeenCalledWith(['sessions']);
    });

    it('should update session when in update mode', () => {
      // Arrange
      component.onUpdate = true;
      component['id'] = '1';
      component.sessionForm?.patchValue({
        name: 'Updated Session',
        description: 'Updated Description',
        date: '2023-12-25',
        teacher_id: 1
      });

      // Act
      component.submit();

      // Assert
      expect(sessionApiService.update).toHaveBeenCalledWith('1', expect.any(Object));
      expect(matSnackBar.open).toHaveBeenCalledWith('Session updated !', 'Close', { duration: 3000 });
      expect(router.navigate).toHaveBeenCalledWith(['sessions']);
    });

    it('should pass correct session data to create', () => {
      // Arrange
      component.onUpdate = false;
      const sessionData = {
        name: 'Test Session',
        description: 'Test Description',
        date: '2023-12-25',
        teacher_id: 2
      };
      component.sessionForm?.patchValue(sessionData);

      // Act
      component.submit();

      // Assert
      expect(sessionApiService.create).toHaveBeenCalledWith(sessionData);
    });

    it('should pass correct session data to update', () => {
      // Arrange
      component.onUpdate = true;
      component['id'] = '123';
      const sessionData = {
        name: 'Updated Session',
        description: 'Updated Description',
        date: '2023-12-30',
        teacher_id: 3
      };
      component.sessionForm?.patchValue(sessionData);

      // Act
      component.submit();

      // Assert
      expect(sessionApiService.update).toHaveBeenCalledWith('123', sessionData);
    });
  });

  describe('initForm', () => {
    it('should initialize form with empty values when no session provided', () => {
      // Act
      component['initForm']();

      // Assert
      expect(component.sessionForm?.get('name')?.value).toBe('');
      expect(component.sessionForm?.get('description')?.value).toBe('');
      expect(component.sessionForm?.get('date')?.value).toBe('');
      expect(component.sessionForm?.get('teacher_id')?.value).toBe('');
    });

    it('should initialize form with session values when session provided', () => {
      // Arrange
      const session: Session = {
        name: 'Test Session',
        description: 'Test Description',
        date: new Date('2023-12-25'),
        teacher_id: 1,
        users: []
      };

      // Act
      component['initForm'](session);

      // Assert
      expect(component.sessionForm?.get('name')?.value).toBe('Test Session');
      expect(component.sessionForm?.get('description')?.value).toBe('Test Description');
      expect(component.sessionForm?.get('date')?.value).toBe('2023-12-25');
      expect(component.sessionForm?.get('teacher_id')?.value).toBe(1);
    });

    it('should set required validators', () => {
      // Act
      component['initForm']();

      // Assert
      expect(component.sessionForm?.get('name')?.hasError('required')).toBe(true);
      expect(component.sessionForm?.get('description')?.hasError('required')).toBe(true);
      expect(component.sessionForm?.get('date')?.hasError('required')).toBe(true);
      expect(component.sessionForm?.get('teacher_id')?.hasError('required')).toBe(true);
    });
  });

  describe('exitPage', () => {
    it('should show snackbar and navigate to sessions', () => {
      // Act
      component['exitPage']('Test message');

      // Assert
      expect(matSnackBar.open).toHaveBeenCalledWith('Test message', 'Close', { duration: 3000 });
      expect(router.navigate).toHaveBeenCalledWith(['sessions']);
    });
  });

  describe('teachers$', () => {
    it('should load teachers on initialization', () => {
      expect(teacherService.all).toHaveBeenCalled();
      expect(component.teachers$).toBeDefined();
    });
  });
});

describe('Sessions Management E2E Tests', () => {
  const mockUser = {
    id: 1,
    username: 'yoga@studio.com',
    firstName: 'Admin',
    lastName: 'User',
    admin: true,
    token: 'mock-jwt-token',
    type: 'Bearer'
  };

  const mockRegularUser = {
    id: 2,
    username: 'user@example.com',
    firstName: 'Regular',
    lastName: 'User',
    admin: false,
    token: 'mock-jwt-token-user',
    type: 'Bearer'
  };

  const mockSessions = [
    {
      id: 1,
      name: 'Yoga Session 1',
      description: 'Morning yoga session',
      date: '2024-03-15T10:00:00.000Z',
      teacher_id: 1,
      users: [2],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 2,
      name: 'Yoga Session 2',
      description: 'Evening relaxation',
      date: '2024-03-16T18:00:00.000Z',
      teacher_id: 1,
      users: [1, 2],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ];

  const mockTeachers = [
    {
      id: 1,
      firstName: 'Jane',
      lastName: 'Doe',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 2,
      firstName: 'John',
      lastName: 'Smith',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    // Clear session storage
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  describe('Sessions List', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Mock API calls
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: mockSessions
      }).as('getSessions');
    });

    it('should display list of sessions', () => {
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Verify sessions are displayed
      cy.get('.item').should('have.length', 2);
      
      // Verify session content
      cy.contains('Yoga Session 1').should('be.visible');
      cy.contains('Morning yoga session').should('be.visible');
      cy.contains('Yoga Session 2').should('be.visible');
      cy.contains('Evening relaxation').should('be.visible');
    });

    it('should show create button for admin users', () => {
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Admin should see create button
      cy.get('[data-cy=create-session-button]').should('be.visible');
    });

    it('should hide create button for regular users', () => {
      // Setup regular user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockRegularUser));
      });

      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Regular user should not see create button
      cy.get('[data-cy=create-session-button]').should('not.exist');
    });

    it('should navigate to session detail when clicking on a session', () => {
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Mock session detail API
      cy.intercept('GET', '/api/session/1', {
        statusCode: 200,
        body: mockSessions[0]
      }).as('getSessionDetail');

      cy.intercept('GET', '/api/teacher/1', {
        statusCode: 200,
        body: mockTeachers[0]
      }).as('getTeacher');

      // Click on first session
      cy.get('.item').first().click();

      // Wait for navigation and API calls
      cy.wait('@getSessionDetail');
      cy.wait('@getTeacher');

      // Verify navigation to detail page
      cy.url().should('include', '/sessions/detail/1');
    });

    it('should navigate to create session when clicking create button', () => {
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Mock teachers API for create form
      cy.intercept('GET', '/api/teacher', {
        statusCode: 200,
        body: mockTeachers
      }).as('getTeachers');

      // Click create button
      cy.get('[data-cy=create-session-button]').click();

      // Wait for teachers API
      cy.wait('@getTeachers');

      // Verify navigation to create page
      cy.url().should('include', '/sessions/create');
    });

    it('should display empty message when no sessions exist', () => {
      // Mock empty sessions response
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: []
      }).as('getEmptySessions');

      cy.visit('/sessions');
      cy.wait('@getEmptySessions');

      // Should show appropriate empty state message or no sessions
      cy.get('.item').should('have.length', 0);
    });
  });

  describe('Session Detail', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Mock API calls
      cy.intercept('GET', '/api/session/1', {
        statusCode: 200,
        body: mockSessions[0]
      }).as('getSessionDetail');

      cy.intercept('GET', '/api/teacher/1', {
        statusCode: 200,
        body: mockTeachers[0]
      }).as('getTeacher');
    });

    it('should display session details', () => {
      cy.visit('/sessions/detail/1');
      cy.wait('@getSessionDetail');
      cy.wait('@getTeacher');

      // Verify session information is displayed
      cy.contains('Yoga Session 1').should('be.visible');
      cy.contains('Morning yoga session').should('be.visible');
      cy.contains('Jane DOE').should('be.visible'); // Teacher name
      cy.contains('1 attendees').should('be.visible');
    });

    it('should allow admin to delete session', () => {
      cy.visit('/sessions/detail/1');
      cy.wait('@getSessionDetail');
      cy.wait('@getTeacher');

      // Mock delete API
      cy.intercept('DELETE', '/api/session/1', {
        statusCode: 200,
        body: {}
      }).as('deleteSession');

      // Mock sessions list for redirect
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: mockSessions.filter(s => s.id !== 1)
      }).as('getSessionsAfterDelete');

      // Admin should see delete button
      cy.get('[data-cy=delete-button]').should('be.visible').click();

      // Confirm deletion (if there's a confirmation dialog)
      cy.wait('@deleteSession');

      // Should redirect to sessions list
      cy.url().should('include', '/sessions');
      cy.wait('@getSessionsAfterDelete');
    });

    it('should allow admin to edit session', () => {
      cy.visit('/sessions/detail/1');
      cy.wait('@getSessionDetail');
      cy.wait('@getTeacher');

      // Mock teachers API for edit form
      cy.intercept('GET', '/api/teacher', {
        statusCode: 200,
        body: mockTeachers
      }).as('getTeachers');

      // Admin should see edit button
      cy.get('[data-cy=edit-button]').should('be.visible').click();

      // Wait for teachers API
      cy.wait('@getTeachers');

      // Should navigate to edit page
      cy.url().should('include', '/sessions/update/1');
    });

    it('should allow user to participate in session', () => {
      // Setup user not participating in session
      const sessionWithoutUser = { ...mockSessions[0], users: [] };
      
      cy.intercept('GET', '/api/session/1', {
        statusCode: 200,
        body: sessionWithoutUser
      }).as('getSessionDetail');

      cy.visit('/sessions/detail/1');
      cy.wait('@getSessionDetail');
      cy.wait('@getTeacher');

      // Mock participate API
      cy.intercept('POST', '/api/session/1/participate/1', {
        statusCode: 200,
        body: {}
      }).as('participateSession');

      // Mock updated session after participation
      cy.intercept('GET', '/api/session/1', {
        statusCode: 200,
        body: { ...sessionWithoutUser, users: [1] }
      }).as('getUpdatedSession');

      // User should see participate button
      cy.get('[data-cy=participate-button]').should('be.visible').click();

      // Wait for participation API
      cy.wait('@participateSession');
      cy.wait('@getUpdatedSession');
      cy.wait('@getTeacher');

      // Button should change to unparticipate
      cy.get('[data-cy=unparticipate-button]').should('be.visible');
    });

    it('should allow user to unparticipate from session', () => {
      // Setup user participating in session
      const sessionWithUser = { ...mockSessions[0], users: [1] };
      
      cy.intercept('GET', '/api/session/1', {
        statusCode: 200,
        body: sessionWithUser
      }).as('getSessionDetail');

      cy.visit('/sessions/detail/1');
      cy.wait('@getSessionDetail');
      cy.wait('@getTeacher');

      // Mock unparticipate API
      cy.intercept('DELETE', '/api/session/1/participate/1', {
        statusCode: 200,
        body: {}
      }).as('unparticipateSession');

      // Mock updated session after unparticipation
      cy.intercept('GET', '/api/session/1', {
        statusCode: 200,
        body: { ...sessionWithUser, users: [] }
      }).as('getUpdatedSession');

      // User should see unparticipate button
      cy.get('[data-cy=unparticipate-button]').should('be.visible').click();

      // Wait for unparticipation API
      cy.wait('@unparticipateSession');
      cy.wait('@getUpdatedSession');
      cy.wait('@getTeacher');

      // Button should change to participate
      cy.get('[data-cy=participate-button]').should('be.visible');
    });

    it('should navigate back to sessions list', () => {
      cy.visit('/sessions/detail/1');
      cy.wait('@getSessionDetail');
      cy.wait('@getTeacher');

      // Mock sessions list for back navigation
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: mockSessions
      }).as('getSessions');

      // Click back button
      cy.get('[data-cy=back-button]').click();

      // Should navigate back to sessions list
      cy.url().should('include', '/sessions');
      cy.wait('@getSessions');
    });
  });

  describe('Session Creation', () => {
    beforeEach(() => {
      // Setup authenticated admin user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Mock teachers API
      cy.intercept('GET', '/api/teacher', {
        statusCode: 200,
        body: mockTeachers
      }).as('getTeachers');
    });

    it('should create new session with valid data', () => {
      cy.visit('/sessions/create');
      cy.wait('@getTeachers');

      // Fill session form
      cy.get('input[formControlName=name]').type('New Yoga Session');
      cy.get('textarea[formControlName=description]').type('A new yoga session for beginners');
      cy.get('input[formControlName=date]').type('2024-04-15');
      cy.get('mat-select[formControlName=teacher_id]').click();
      cy.get('mat-option').first().click();

      // Mock create session API
      cy.intercept('POST', '/api/session', {
        statusCode: 201,
        body: {
          id: 3,
          name: 'New Yoga Session',
          description: 'A new yoga session for beginners',
          date: '2024-04-15T00:00:00.000Z',
          teacher_id: 1,
          users: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      }).as('createSession');

      // Mock sessions list for redirect
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: [...mockSessions, {
          id: 3,
          name: 'New Yoga Session',
          description: 'A new yoga session for beginners',
          date: '2024-04-15T00:00:00.000Z',
          teacher_id: 1,
          users: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }]
      }).as('getSessionsAfterCreate');

      // Submit form
      cy.get('button[type=submit]').click();

      // Wait for create API
      cy.wait('@createSession').then((interception) => {
        expect(interception.request.body).to.deep.include({
          name: 'New Yoga Session',
          description: 'A new yoga session for beginners',
          teacher_id: 1
        });
      });

      // Should redirect to sessions list
      cy.url().should('include', '/sessions');
      cy.wait('@getSessionsAfterCreate');
    });

    it('should validate required fields', () => {
      cy.visit('/sessions/create');
      cy.wait('@getTeachers');

      // Submit button should be disabled initially
      cy.get('button[type=submit]').should('be.disabled');

      // Fill only name
      cy.get('input[formControlName=name]').type('Test Session');
      cy.get('button[type=submit]').should('be.disabled');

      // Fill description
      cy.get('textarea[formControlName=description]').type('Test description');
      cy.get('button[type=submit]').should('be.disabled');

      // Fill date
      cy.get('input[formControlName=date]').type('2024-04-15');
      cy.get('button[type=submit]').should('be.disabled');

      // Select teacher
      cy.get('mat-select[formControlName=teacher_id]').click();
      cy.get('mat-option').first().click();
      cy.get('button[type=submit]').should('not.be.disabled');
    });

    it('should handle creation error', () => {
      cy.visit('/sessions/create');
      cy.wait('@getTeachers');

      // Fill form
      cy.get('input[formControlName=name]').type('New Yoga Session');
      cy.get('textarea[formControlName=description]').type('A new yoga session');
      cy.get('input[formControlName=date]').type('2024-04-15');
      cy.get('mat-select[formControlName=teacher_id]').click();
      cy.get('mat-option').first().click();

      // Mock create session API error
      cy.intercept('POST', '/api/session', {
        statusCode: 400,
        body: { error: 'Session creation failed' }
      }).as('createSessionError');

      // Submit form
      cy.get('button[type=submit]').click();

      // Wait for error
      cy.wait('@createSessionError');

      // Should stay on create page
      cy.url().should('include', '/sessions/create');
    });
  });

  describe('Session Update', () => {
    beforeEach(() => {
      // Setup authenticated admin user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Mock APIs
      cy.intercept('GET', '/api/session/1', {
        statusCode: 200,
        body: mockSessions[0]
      }).as('getSessionForUpdate');

      cy.intercept('GET', '/api/teacher', {
        statusCode: 200,
        body: mockTeachers
      }).as('getTeachers');
    });

    it('should update session with modified data', () => {
      cy.visit('/sessions/update/1');
      cy.wait('@getSessionForUpdate');
      cy.wait('@getTeachers');

      // Form should be pre-filled with existing data
      cy.get('input[formControlName=name]').should('have.value', 'Yoga Session 1');

      // Modify session data
      cy.get('input[formControlName=name]').clear().type('Updated Yoga Session');
      cy.get('textarea[formControlName=description]').clear().type('Updated description');

      // Mock update session API
      cy.intercept('PUT', '/api/session/1', {
        statusCode: 200,
        body: {
          ...mockSessions[0],
          name: 'Updated Yoga Session',
          description: 'Updated description'
        }
      }).as('updateSession');

      // Mock sessions list for redirect
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: mockSessions
      }).as('getSessionsAfterUpdate');

      // Submit form
      cy.get('button[type=submit]').click();

      // Wait for update API
      cy.wait('@updateSession').then((interception) => {
        expect(interception.request.body).to.deep.include({
          name: 'Updated Yoga Session',
          description: 'Updated description'
        });
      });

      // Should redirect to sessions list
      cy.url().should('include', '/sessions');
      cy.wait('@getSessionsAfterUpdate');
    });

    it('should handle update error', () => {
      cy.visit('/sessions/update/1');
      cy.wait('@getSessionForUpdate');
      cy.wait('@getTeachers');

      // Modify session data
      cy.get('input[formControlName=name]').clear().type('Updated Name');

      // Mock update session API error
      cy.intercept('PUT', '/api/session/1', {
        statusCode: 400,
        body: { error: 'Update failed' }
      }).as('updateSessionError');

      // Submit form
      cy.get('button[type=submit]').click();

      // Wait for error
      cy.wait('@updateSessionError');

      // Should stay on update page
      cy.url().should('include', '/sessions/update/1');
    });
  });

  describe('Session Access Control', () => {
    it('should prevent regular users from accessing create page', () => {
      // Setup regular user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockRegularUser));
      });

      // Try to visit create page
      cy.visit('/sessions/create');

      // Should redirect or show error (depending on implementation)
      cy.url().should('not.include', '/sessions/create');
    });

    it('should prevent regular users from accessing update page', () => {
      // Setup regular user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockRegularUser));
      });

      // Try to visit update page
      cy.visit('/sessions/update/1');

      // Should redirect or show error (depending on implementation)  
      cy.url().should('not.include', '/sessions/update/1');
    });
  });
});
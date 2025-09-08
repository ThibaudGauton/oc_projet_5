describe('Authentication E2E Tests', () => {
  beforeEach(() => {
    // Clear any existing session storage
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  describe('Login Flow', () => {
    it('should successfully log in with valid credentials', () => {
      cy.visit('/login');
      
      // Mock successful login response
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          id: 1,
          username: 'yoga@studio.com',
          firstName: 'Admin',
          lastName: 'User',
          admin: true,
          token: 'mock-jwt-token',
          type: 'Bearer'
        },
      }).as('loginRequest');

      // Mock sessions API
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: []
      }).as('getSessions');

      // Fill login form
      cy.get('input[formControlName=email]').type('yoga@studio.com');
      cy.get('input[formControlName=password]').type('test!1234');
      
      // Submit form
      cy.get('button[type=submit]').click();
      
      // Verify API call
      cy.wait('@loginRequest').then((interception) => {
        expect(interception.request.body).to.deep.equal({
          email: 'yoga@studio.com',
          password: 'test!1234'
        });
      });
      
      // Verify redirect to sessions
      cy.url().should('include', '/sessions');
      cy.wait('@getSessions');
    });

    it('should show error message with invalid credentials', () => {
      cy.visit('/login');
      
      // Mock failed login response
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { error: 'Unauthorized' }
      }).as('loginFailure');

      // Fill login form with invalid credentials
      cy.get('input[formControlName=email]').type('invalid@email.com');
      cy.get('input[formControlName=password]').type('wrongpassword');
      
      // Submit form
      cy.get('button[type=submit]').click();
      
      // Verify API call
      cy.wait('@loginFailure');
      
      // Verify error message appears
      cy.get('.error').should('be.visible').and('contain', 'An error occurred');
      
      // Verify we stay on login page
      cy.url().should('include', '/login');
    });

    it('should validate required fields', () => {
      cy.visit('/login');
      
      // Try to submit without filling fields
      cy.get('button[type=submit]').should('be.disabled');
      
      // Fill only email
      cy.get('input[formControlName=email]').type('test@example.com');
      cy.get('button[type=submit]').should('be.disabled');
      
      // Fill only password
      cy.get('input[formControlName=email]').clear();
      cy.get('input[formControlName=password]').type('password');
      cy.get('button[type=submit]').should('be.disabled');
      
      // Fill both fields
      cy.get('input[formControlName=email]').type('test@example.com');
      cy.get('button[type=submit]').should('not.be.disabled');
    });

    it('should validate email format', () => {
      cy.visit('/login');
      
      // Enter invalid email format
      cy.get('input[formControlName=email]').type('invalid-email');
      cy.get('input[formControlName=password]').type('password123');
      
      // Button should remain disabled
      cy.get('button[type=submit]').should('be.disabled');
      
      // Enter valid email format
      cy.get('input[formControlName=email]').clear().type('valid@email.com');
      cy.get('button[type=submit]').should('not.be.disabled');
    });
  });

  describe('Registration Flow', () => {
    it('should successfully register new user', () => {
      cy.visit('/register');
      
      // Mock successful registration response
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 200,
        body: { message: 'User registered successfully' }
      }).as('registerRequest');

      // Fill registration form
      cy.get('input[formControlName=email]').type('newuser@example.com');
      cy.get('input[formControlName=firstName]').type('John');
      cy.get('input[formControlName=lastName]').type('Doe');
      cy.get('input[formControlName=password]').type('password123');
      
      // Submit form
      cy.get('button[type=submit]').click();
      
      // Verify API call
      cy.wait('@registerRequest').then((interception) => {
        expect(interception.request.body).to.deep.equal({
          email: 'newuser@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'password123'
        });
      });
      
      // Verify redirect to login
      cy.url().should('include', '/login');
    });

    it('should show error for duplicate email registration', () => {
      cy.visit('/register');
      
      // Mock failed registration response
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 400,
        body: { error: 'Email already exists' }
      }).as('registerFailure');

      // Fill registration form
      cy.get('input[formControlName=email]').type('existing@example.com');
      cy.get('input[formControlName=firstName]').type('John');
      cy.get('input[formControlName=lastName]').type('Doe');
      cy.get('input[formControlName=password]').type('password123');
      
      // Submit form
      cy.get('button[type=submit]').click();
      
      // Verify API call
      cy.wait('@registerFailure');
      
      // Verify error message appears
      cy.get('.error').should('be.visible').and('contain', 'An error occurred');
      
      // Verify we stay on register page
      cy.url().should('include', '/register');
    });

    it('should validate registration form fields', () => {
      cy.visit('/register');
      
      // Check initial state - button disabled
      cy.get('button[type=submit]').should('be.disabled');
      
      // Fill fields one by one
      cy.get('input[formControlName=email]').type('test@example.com');
      cy.get('button[type=submit]').should('be.disabled');
      
      cy.get('input[formControlName=firstName]').type('John');
      cy.get('button[type=submit]').should('be.disabled');
      
      cy.get('input[formControlName=lastName]').type('Doe');
      cy.get('button[type=submit]').should('be.disabled');
      
      cy.get('input[formControlName=password]').type('password123');
      cy.get('button[type=submit]').should('not.be.disabled');
    });

    it('should validate password minimum length', () => {
      cy.visit('/register');
      
      // Fill all fields with short password
      cy.get('input[formControlName=email]').type('test@example.com');
      cy.get('input[formControlName=firstName]').type('John');
      cy.get('input[formControlName=lastName]').type('Doe');
      cy.get('input[formControlName=password]').type('123');
      
      // Button should remain disabled
      cy.get('button[type=submit]').should('be.disabled');
      
      // Use valid length password
      cy.get('input[formControlName=password]').clear().type('password123');
      cy.get('button[type=submit]').should('not.be.disabled');
    });
  });

  describe('Navigation between Auth Pages', () => {
    it('should navigate from login to register', () => {
      cy.visit('/login');
      
      // Click register link
      cy.contains('Register').click();
      
      // Verify navigation to register page
      cy.url().should('include', '/register');
      cy.get('input[formControlName=firstName]').should('be.visible');
    });

    it('should navigate from register to login', () => {
      cy.visit('/register');
      
      // Click login link  
      cy.contains('Login').click();
      
      // Verify navigation to login page
      cy.url().should('include', '/login');
      cy.get('input[formControlName=email]').should('be.visible');
      cy.get('input[formControlName=firstName]').should('not.exist');
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      // Setup authenticated user session
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify({
          id: 1,
          username: 'yoga@studio.com',
          firstName: 'Admin',
          lastName: 'User',
          admin: true,
          token: 'mock-jwt-token',
          type: 'Bearer'
        }));
      });
      
      // Mock sessions API for authenticated state
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: []
      }).as('getSessions');
    });

    it('should successfully logout and redirect to home', () => {
      cy.visit('/sessions');
      cy.wait('@getSessions');
      
      // Verify user is logged in (logout button visible)
      cy.get('[data-cy=logout-button]').should('be.visible');
      
      // Click logout
      cy.get('[data-cy=logout-button]').click();
      
      // Verify redirect to home/login
      cy.url().should('match', /\/(login)?$/);
      
      // Verify session is cleared
      cy.window().then((win) => {
        expect(win.sessionStorage.getItem('sessionInformation')).to.be.null;
      });
    });

    it('should show login page when accessing protected routes after logout', () => {
      cy.visit('/sessions');
      cy.wait('@getSessions');
      
      // Logout
      cy.get('[data-cy=logout-button]').click();
      
      // Try to access protected route
      cy.visit('/sessions');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });

  describe('Protected Routes Access', () => {
    it('should redirect to login when accessing sessions without auth', () => {
      cy.visit('/sessions');
      cy.url().should('include', '/login');
    });

    it('should redirect to login when accessing profile without auth', () => {
      cy.visit('/me');
      cy.url().should('include', '/login');
    });

    it('should allow access to protected routes when authenticated', () => {
      // Setup authenticated session
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify({
          id: 1,
          username: 'yoga@studio.com',
          firstName: 'Admin',
          lastName: 'User',
          admin: true,
          token: 'mock-jwt-token',
          type: 'Bearer'
        }));
      });

      // Mock API calls
      cy.intercept('GET', '/api/session', []).as('getSessions');
      cy.intercept('GET', '/api/user/1', {
        statusCode: 200,
        body: {
          id: 1,
          email: 'yoga@studio.com',
          firstName: 'Admin',
          lastName: 'User',
          admin: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      }).as('getUser');

      // Access protected routes
      cy.visit('/sessions');
      cy.wait('@getSessions');
      cy.url().should('include', '/sessions');

      cy.visit('/me');
      cy.wait('@getUser');
      cy.url().should('include', '/me');
    });
  });
});
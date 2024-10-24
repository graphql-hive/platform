import { Token } from '../../cypress.config';

beforeEach(() => {
  cy.task('deleteUser');
  cy.task<Token>('createUser').then(result => {
    cy.task('createOrganization', result.sAccessToken);
    cy.task('createProject', result.sAccessToken);
    cy.setCookie('sRefreshToken', result.sRefreshToken);
    cy.setCookie('sAccessToken', result.sAccessToken);
  });
  cy.visit('/foo/my-new-project/development/laboratory');
});

describe('Laboratory Collections', () => {
  it('should show toast when there is no collections', () => {
    cy.dataCy('save-operation').click();
    cy.dataCy('save-operation-as').click();
    cy.get('.Toastify').contains('Please create a collection first.');
  });

  it('should create a collection', () => {
    const collectionName = 'Test Collection';
    cy.dataCy('create-collection').click();
    cy.dataCy('collection-name').type(collectionName);
    cy.dataCy('collection-description').type('Test Description');
    cy.dataCy('save-collection').click();
    cy.get('.graphiql-plugin').contains(collectionName);
  });

  it('should save operation to collection', () => {
    cy.getCookie('sAccessToken').then(result => {
      cy.task('createCollection', result.value);
    });
    cy.reload();
    cy.get('.graphiql-query-editor .graphiql-editor textarea').type('{CMD}{A}{Backspace}', {
      force: true,
    });
    cy.get('.graphiql-query-editor .graphiql-editor textarea').type('{\nfoo', {
      force: true,
    });
    const operationName = 'Test Operation';
    cy.dataCy('save-operation').click();
    cy.dataCy('save-operation-as').click();
    cy.dataCy('operation-name').type(operationName);
    cy.dataCy('collections-select').click();
    cy.dataCy('collections-select-item').first().click();
    cy.dataCy('confirm').click();
    cy.get('.graphiql-plugin').contains(operationName);
    cy.get('body').contains('Operation "Test Operation" added to collection "Test Collection"');
  });
});

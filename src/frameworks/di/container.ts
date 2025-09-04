// Dependency injection container for the application
import { AuthUseCaseImpl, AuthUseCase } from '../../usecases/AuthUseCase';
import { GradeUseCaseImpl, GradeUseCase } from '../../usecases/GradeUseCase';
import { AuthApiGateway } from '../../adapters/gateways/AuthApiGateway';
import { GradeApiGateway } from '../../adapters/gateways/GradeApiGateway';
import { TokenStorage } from '../storage/TokenStorage';
import { HttpClient } from '../api/HttpClient';

// Container interface
export interface DIContainer {
  authUseCase: AuthUseCase;
  gradeUseCase: GradeUseCase;
  tokenStorage: TokenStorage;
}

// Create and configure the dependency injection container
export function createDIContainer(): DIContainer {
  // Create infrastructure dependencies
  const tokenStorage = new TokenStorage();
  const httpClient = new HttpClient();

  // Create gateways
  const authGateway = new AuthApiGateway(httpClient, tokenStorage);
  const gradeGateway = new GradeApiGateway(httpClient, tokenStorage);

  // Create use cases
  const authUseCase = new AuthUseCaseImpl(authGateway, tokenStorage);
  const gradeUseCase = new GradeUseCaseImpl(gradeGateway);

  return {
    authUseCase,
    gradeUseCase,
    tokenStorage,
  };
}

// Singleton container instance
let containerInstance: DIContainer | null = null;

// Get the singleton container instance
export function getContainer(): DIContainer {
  if (!containerInstance) {
    containerInstance = createDIContainer();
  }
  return containerInstance;
}

// Reset container (useful for testing)
export function resetContainer(): void {
  containerInstance = null;
}

import { ApiProblemDetailsDto } from '@shared/models';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly problemDetails: ApiProblemDetailsDto | null;

  public constructor(statusCode: number, message: string, problemDetails: ApiProblemDetailsDto | null = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.problemDetails = problemDetails;
  }
}

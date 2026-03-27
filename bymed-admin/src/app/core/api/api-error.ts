import { ApiProblemDetailsDto } from '@shared/models';

export interface ApiValidationErrorItem {
  readonly propertyName: string;
  readonly errorMessage: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly problemDetails: ApiProblemDetailsDto | null;
  public readonly validationErrors: readonly ApiValidationErrorItem[] | undefined;

  public constructor(
    statusCode: number,
    message: string,
    problemDetails: ApiProblemDetailsDto | null = null,
    validationErrors?: readonly ApiValidationErrorItem[]
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.problemDetails = problemDetails;
    this.validationErrors = validationErrors;
  }
}

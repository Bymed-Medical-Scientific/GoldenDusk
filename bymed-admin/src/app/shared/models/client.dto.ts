export interface ClientTypeDto {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export interface CreateClientTypeRequestDto {
  readonly name: string;
  readonly slug: string;
}

export interface UpdateClientTypeRequestDto {
  readonly name: string;
  readonly slug: string;
}

export interface ClientContactPersonDto {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly faculty?: string;
}

export interface ClientContactPersonRequestDto {
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly faculty?: string;
}

export interface ClientDto {
  readonly id: string;
  readonly institutionName: string;
  readonly address: string;
  readonly email?: string;
  readonly phone?: string;
  readonly telephone?: string;
  readonly clientTypeId: string;
  readonly clientTypeName: string;
  readonly contactPersons: ClientContactPersonDto[];
}

export interface CreateClientRequestDto {
  readonly institutionName: string;
  readonly address: string;
  readonly clientTypeId: string;
  readonly email?: string;
  readonly phone?: string;
  readonly telephone?: string;
  readonly contactPersons?: ClientContactPersonRequestDto[];
}

export interface UpdateClientRequestDto extends CreateClientRequestDto {}

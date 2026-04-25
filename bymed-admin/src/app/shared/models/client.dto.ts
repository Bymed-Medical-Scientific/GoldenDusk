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

export interface ClientDto {
  readonly id: string;
  readonly institutionName: string;
  readonly address: string;
  readonly email1?: string;
  readonly email2?: string;
  readonly email3?: string;
  readonly phoneNumber1?: string;
  readonly phoneNumber2?: string;
  readonly phoneNumber3?: string;
  readonly telephoneNumber1?: string;
  readonly telephoneNumber2?: string;
  readonly telephoneNumber3?: string;
  readonly contactPerson1Name?: string;
  readonly contactPerson1Email?: string;
  readonly contactPerson1Telephone?: string;
  readonly contactPerson2Name?: string;
  readonly contactPerson2Email?: string;
  readonly contactPerson2Telephone?: string;
  readonly clientTypeId: string;
  readonly clientTypeName: string;
}

export interface CreateClientRequestDto {
  readonly institutionName: string;
  readonly address: string;
  readonly clientTypeId: string;
  readonly email1?: string;
  readonly email2?: string;
  readonly email3?: string;
  readonly phoneNumber1?: string;
  readonly phoneNumber2?: string;
  readonly phoneNumber3?: string;
  readonly telephoneNumber1?: string;
  readonly telephoneNumber2?: string;
  readonly telephoneNumber3?: string;
  readonly contactPerson1Name?: string;
  readonly contactPerson1Email?: string;
  readonly contactPerson1Telephone?: string;
  readonly contactPerson2Name?: string;
  readonly contactPerson2Email?: string;
  readonly contactPerson2Telephone?: string;
}

export interface UpdateClientRequestDto extends CreateClientRequestDto {}

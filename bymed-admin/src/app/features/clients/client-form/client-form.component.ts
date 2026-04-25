import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import {
  ClientTypeDto,
  CreateClientRequestDto,
  UpdateClientRequestDto
} from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, SelectModule, InputTextModule],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss'
})
export class ClientFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.id !== null;
  protected readonly isInitializing = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly clientTypes = signal<ClientTypeDto[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    institutionName: ['', [Validators.required, Validators.maxLength(250)]],
    address: ['', [Validators.required, Validators.maxLength(600)]],
    clientTypeId: ['', Validators.required],
    email1: [''],
    email2: [''],
    email3: [''],
    phoneNumber1: [''],
    phoneNumber2: [''],
    phoneNumber3: [''],
    telephoneNumber1: [''],
    telephoneNumber2: [''],
    telephoneNumber3: [''],
    contactPerson1Name: [''],
    contactPerson1Email: [''],
    contactPerson1Telephone: [''],
    contactPerson2Name: [''],
    contactPerson2Email: [''],
    contactPerson2Telephone: ['']
  });

  public ngOnInit(): void {
    this.adminApi
      .getClientTypes()
      .pipe(
        catchError(() => {
          this.errorMessage.set('Could not load client types.');
          return EMPTY;
        })
      )
      .subscribe((rows) => {
        this.clientTypes.set(rows);
        this.loadClientIfEdit();
      });
  }

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    const payload = this.mapPayload();
    const request$ = this.id
      ? this.adminApi.updateClient(this.id, payload as UpdateClientRequestDto)
      : this.adminApi.createClient(payload as CreateClientRequestDto);

    request$
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/clients']),
        error: (err: unknown) => {
          this.errorMessage.set(err instanceof ApiError ? err.message : 'Save failed.');
        }
      });
  }

  private mapPayload(): CreateClientRequestDto {
    const raw = this.form.getRawValue();
    const sanitize = (value: string): string | undefined => {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    return {
      institutionName: raw.institutionName.trim(),
      address: raw.address.trim(),
      clientTypeId: raw.clientTypeId,
      email1: sanitize(raw.email1),
      email2: sanitize(raw.email2),
      email3: sanitize(raw.email3),
      phoneNumber1: sanitize(raw.phoneNumber1),
      phoneNumber2: sanitize(raw.phoneNumber2),
      phoneNumber3: sanitize(raw.phoneNumber3),
      telephoneNumber1: sanitize(raw.telephoneNumber1),
      telephoneNumber2: sanitize(raw.telephoneNumber2),
      telephoneNumber3: sanitize(raw.telephoneNumber3),
      contactPerson1Name: sanitize(raw.contactPerson1Name),
      contactPerson1Email: sanitize(raw.contactPerson1Email),
      contactPerson1Telephone: sanitize(raw.contactPerson1Telephone),
      contactPerson2Name: sanitize(raw.contactPerson2Name),
      contactPerson2Email: sanitize(raw.contactPerson2Email),
      contactPerson2Telephone: sanitize(raw.contactPerson2Telephone)
    };
  }

  private loadClientIfEdit(): void {
    if (!this.id) {
      this.isInitializing.set(false);
      return;
    }

    this.adminApi
      .getClientById(this.id)
      .pipe(
        catchError(() => {
          this.errorMessage.set('Could not load client.');
          return EMPTY;
        }),
        finalize(() => this.isInitializing.set(false))
      )
      .subscribe((row) => {
        this.form.patchValue({
          institutionName: row.institutionName,
          address: row.address,
          clientTypeId: row.clientTypeId,
          email1: row.email1 ?? '',
          email2: row.email2 ?? '',
          email3: row.email3 ?? '',
          phoneNumber1: row.phoneNumber1 ?? '',
          phoneNumber2: row.phoneNumber2 ?? '',
          phoneNumber3: row.phoneNumber3 ?? '',
          telephoneNumber1: row.telephoneNumber1 ?? '',
          telephoneNumber2: row.telephoneNumber2 ?? '',
          telephoneNumber3: row.telephoneNumber3 ?? '',
          contactPerson1Name: row.contactPerson1Name ?? '',
          contactPerson1Email: row.contactPerson1Email ?? '',
          contactPerson1Telephone: row.contactPerson1Telephone ?? '',
          contactPerson2Name: row.contactPerson2Name ?? '',
          contactPerson2Email: row.contactPerson2Email ?? '',
          contactPerson2Telephone: row.contactPerson2Telephone ?? ''
        });
      });
  }
}

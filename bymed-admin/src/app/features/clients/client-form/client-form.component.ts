import { Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
    email: [''],
    phone: [''],
    telephone: [''],
    contactPersons: this.fb.array([this.createContactPersonGroup()])
  });

  protected get contactPersons(): FormArray {
    return this.form.controls.contactPersons;
  }

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

  protected addContactPerson(): void {
    this.contactPersons.push(this.createContactPersonGroup());
  }

  protected removeContactPerson(index: number): void {
    if (this.contactPersons.length <= 1) {
      this.contactPersons.at(0).reset({ name: '', email: '', phone: '', faculty: '' });
      return;
    }
    this.contactPersons.removeAt(index);
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

  private createContactPersonGroup() {
    return this.fb.nonNullable.group({
      name: ['', Validators.maxLength(150)],
      email: [''],
      phone: [''],
      faculty: ['']
    });
  }

  private mapPayload(): CreateClientRequestDto {
    const raw = this.form.getRawValue();
    const sanitize = (value: string): string | undefined => {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    const contactPersons = raw.contactPersons
      .map((row) => ({
        name: row.name.trim(),
        email: sanitize(row.email),
        phone: sanitize(row.phone),
        faculty: sanitize(row.faculty)
      }))
      .filter((row) => row.name.length > 0);

    return {
      institutionName: raw.institutionName.trim(),
      address: raw.address.trim(),
      clientTypeId: raw.clientTypeId,
      email: sanitize(raw.email),
      phone: sanitize(raw.phone),
      telephone: sanitize(raw.telephone),
      contactPersons: contactPersons.length > 0 ? contactPersons : undefined
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
        this.contactPersons.clear();
        const persons = row.contactPersons.length > 0 ? row.contactPersons : [{ id: '', name: '', email: '', phone: '', faculty: '' }];
        for (const person of persons) {
          this.contactPersons.push(
            this.fb.nonNullable.group({
              name: [person.name, Validators.maxLength(150)],
              email: [person.email ?? ''],
              phone: [person.phone ?? ''],
              faculty: [person.faculty ?? '']
            })
          );
        }

        this.form.patchValue({
          institutionName: row.institutionName,
          address: row.address,
          clientTypeId: row.clientTypeId,
          email: row.email ?? '',
          phone: row.phone ?? '',
          telephone: row.telephone ?? ''
        });
      });
  }
}

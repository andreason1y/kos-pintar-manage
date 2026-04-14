import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmptyRoom {
  id: string;
  nomor: number;
  lantai: number;
  room_type?: {
    nama: string;
  };
}

interface PenyewaData {
  nama: string;
  no_hp: string | null;
  email: string | null;
  room_id?: string | null;
  tanggal_masuk?: string;
  jatuh_tempo?: number;
  deposit?: number;
}

interface PenyewaFormProps {
  mode: 'create' | 'edit';
  initialData?: PenyewaData;
  emptyRooms: EmptyRoom[];
  onSubmit: (data: PenyewaFormData) => void;
  isLoading?: boolean;
}

export interface PenyewaFormData {
  nama: string;
  no_hp: string;
  email: string;
  room_id?: string;
  tanggal_masuk?: string;
  jatuh_tempo?: number;
  deposit?: number;
}

const validationSchema = z.object({
  nama: z.string().min(1, 'Nama harus diisi'),
  no_hp: z.string().optional().default(''),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  room_id: z.string().optional(),
  tanggal_masuk: z.string().optional(),
  jatuh_tempo: z.number().optional(),
  deposit: z.number().optional(),
});

type FormData = z.infer<typeof validationSchema>;

export const PenyewaForm: FC<PenyewaFormProps> = ({
  mode,
  initialData,
  emptyRooms,
  onSubmit,
  isLoading = false,
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      nama: initialData?.nama || '',
      no_hp: initialData?.no_hp || '',
      email: initialData?.email || '',
      room_id: initialData?.room_id || '',
      tanggal_masuk: initialData?.tanggal_masuk || new Date().toISOString().split('T')[0],
      jatuh_tempo: initialData?.jatuh_tempo || undefined,
      deposit: initialData?.deposit || undefined,
    },
  });

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      nama: data.nama,
      no_hp: data.no_hp || null,
      email: data.email || null,
      room_id: data.room_id,
      tanggal_masuk: data.tanggal_masuk,
      jatuh_tempo: data.jatuh_tempo,
      deposit: data.deposit,
    });
  };

  const submitLabel = mode === 'create' ? 'Tambah Penyewa' : 'Simpan Perubahan';

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Nama */}
      <div className="space-y-2">
        <Label htmlFor="nama">Nama</Label>
        <Input
          id="nama"
          placeholder="Nama penyewa"
          disabled={mode === 'edit' || isLoading}
          {...form.register('nama')}
        />
        {form.formState.errors.nama && (
          <p className="text-xs text-destructive">{form.formState.errors.nama.message}</p>
        )}
      </div>

      {/* No. HP */}
      <div className="space-y-2">
        <Label htmlFor="no_hp">No. HP</Label>
        <Input
          id="no_hp"
          placeholder="08123456789"
          disabled={isLoading}
          {...form.register('no_hp')}
        />
      </div>

      {/* Kamar - only in create mode */}
      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="room_id">Kamar</Label>
          <Select
            value={form.watch('room_id') || ''}
            onValueChange={(value) => form.setValue('room_id', value)}
            disabled={isLoading}
          >
            <SelectTrigger id="room_id">
              <SelectValue placeholder="Pilih kamar kosong" />
            </SelectTrigger>
            <SelectContent>
              {emptyRooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.room_type?.nama} - No. {room.nomor} (Lt. {room.lantai})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.room_id && (
            <p className="text-xs text-destructive">{form.formState.errors.room_id.message}</p>
          )}
        </div>
      )}

      {/* Tanggal Masuk - only in create mode */}
      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="tanggal_masuk">Tanggal Masuk</Label>
          <Input
            id="tanggal_masuk"
            type="date"
            disabled={isLoading}
            {...form.register('tanggal_masuk')}
          />
        </div>
      )}

      {/* Jatuh Tempo Bayar - only in create mode */}
      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="jatuh_tempo">
            Jatuh Tempo Bayar <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch('jatuh_tempo')?.toString() || ''}
            onValueChange={(value) => form.setValue('jatuh_tempo', parseInt(value))}
            disabled={isLoading}
          >
            <SelectTrigger id="jatuh_tempo">
              <SelectValue placeholder="Pilih tanggal..." />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={String(day)}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Tanggal tagihan otomatis setiap bulannya</p>
          {form.formState.errors.jatuh_tempo && (
            <p className="text-xs text-destructive">{form.formState.errors.jatuh_tempo.message}</p>
          )}
        </div>
      )}

      {/* Deposit - only in create mode */}
      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="deposit">Deposit (Rp)</Label>
          <Input
            id="deposit"
            type="number"
            placeholder="0 (opsional)"
            disabled={isLoading}
            {...form.register('deposit', { valueAsNumber: true })}
          />
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email (opsional)</Label>
        <Input
          id="email"
          type="email"
          placeholder="penyewa@email.com"
          disabled={isLoading}
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {submitLabel}
      </Button>
    </form>
  );
};

export default PenyewaForm;

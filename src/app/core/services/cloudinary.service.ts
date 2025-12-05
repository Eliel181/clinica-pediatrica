import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Imagen } from '../interfaces/imagen.model';
import { lastValueFrom, map } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {

  private http: HttpClient = inject(HttpClient);

  private cloudName = environment.cloudinary.cloudName;
  private uploadPreset = environment.cloudinary.uploadPreset;
  private cloudinaryUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;


  uploadImage(file: File): Promise<Imagen> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    const obs = this.http.post<{ public_id: string, secure_url: string }>(this.cloudinaryUrl, formData)
      .pipe(
        map(response => {
          return {
            public_id: response.public_id,
            secure_url: response.secure_url
          };
        })
      );
    return lastValueFrom(obs);
  }
}

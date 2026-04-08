export interface Photo {
  id: string;
  src: string;
  thumbnail?: string;
  title: string;
  description?: string;
  category: string;
  width: number;
  height: number;
  featured?: boolean;
  camera?: string;
  lens?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  focalLength?: string;
  takenAt?: string;
  location?: string;
  createdAt?: string;
  sortOrder?: number;
}

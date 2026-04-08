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
}

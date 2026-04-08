import PhotoForm from "@/components/PhotoForm";

export default function NewPhotoPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-wider text-white">
          Add Photo
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Add a new photo to your gallery
        </p>
      </div>
      <PhotoForm />
    </div>
  );
}

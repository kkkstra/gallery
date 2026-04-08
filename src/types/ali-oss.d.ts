declare module "ali-oss" {
  interface OSSOptions {
    region: string;
    bucket: string;
    accessKeyId: string;
    accessKeySecret: string;
    endpoint?: string;
    secure?: boolean;
  }

  interface SignatureUrlOptions {
    expires?: number;
    method?: string;
    "Content-Type"?: string;
    process?: string;
    [key: string]: unknown;
  }

  class OSS {
    constructor(options: OSSOptions);
    signatureUrl(name: string, options?: SignatureUrlOptions): string;
  }

  export = OSS;
}

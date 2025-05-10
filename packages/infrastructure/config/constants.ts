export declare const stageType: {
  readonly Local: "local";
  readonly Dev: "dev";
  readonly Prod: "prod";
  readonly Test: "test";
  readonly Qa: "qa";
  readonly Tools: "tools";
  readonly Backup: "backup";
};

export type StageType = (typeof stageType)[keyof typeof stageType];

export type ConfigurationEntry = {
  DOMAIN_NAME: string;
  CERTIFICATE_ARN: string;
};

export const configuration: Partial<Record<StageType, ConfigurationEntry>> = {
  dev: {
    DOMAIN_NAME: "ehsanshekari.com",
    CERTIFICATE_ARN:
      "arn:aws:acm:us-east-1:402870043355:certificate/63ff399d-c86f-41c7-801c-ce7bc79ae8a5",
  },
};

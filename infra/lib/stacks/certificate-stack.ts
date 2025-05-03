import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import { WebsiteACMCertificate } from "../constructs/website-acm-certificate";

export interface CertificateStackProps extends cdk.StackProps {
  readonly domainName: string;
}

export class CertificateStack extends cdk.Stack {
  public readonly certificateArn: string;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: props.env?.account,
        region: "us-east-1",
      },
    });

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: props.domainName,
    });

    const cert = new WebsiteACMCertificate(this, "WebsiteAcmConstruct", {
      domainName: props.domainName,
      hostedZone,
    });

    this.certificateArn = cert.certificate.certificateArn;
  }
}

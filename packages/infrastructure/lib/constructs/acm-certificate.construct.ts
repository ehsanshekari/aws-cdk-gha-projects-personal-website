import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export interface ApiGatewayReginalACMCertificateProps {
  readonly domainName: string;
  readonly hostedZone: route53.IHostedZone;
}

export class ApiGatewayReginalACMCertificate extends Construct {
  public readonly certificate: acm.Certificate;

  constructor(
    scope: Construct,
    id: string,
    props: ApiGatewayReginalACMCertificateProps
  ) {
    super(scope, id);

    this.certificate = new acm.Certificate(
      this,
      "ApiGatewayReginalACMCertificate",
      {
        domainName: props.domainName,
        validation: acm.CertificateValidation.fromDns(props.hostedZone),
      }
    );
  }
}

import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";

export interface WebsiteDnsRecordsProps {
  readonly hostedZone: any; // Use proper type from route53.HostedZone
  readonly distribution: any; // Use proper type from cloudfront.Distribution
  readonly domainName: string;
}

export class WebsiteDnsRecords extends Construct {
  constructor(scope: Construct, id: string, props: WebsiteDnsRecordsProps) {
    super(scope, id);

    // Root domain record
    new route53.ARecord(this, "WebsiteARecord", {
      zone: props.hostedZone,
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(props.distribution),
      ),
    });

    // WWW domain record
    new route53.ARecord(this, "WwwWebsiteARecord", {
      zone: props.hostedZone,
      recordName: `www.${props.domainName}`,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(props.distribution),
      ),
    });
  }
}

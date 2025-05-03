import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";

export interface WebsiteCloudFrontDistributionProps {
  readonly domainNames: string[];
  readonly certificate: any; // Use proper type from acm.Certificate
  readonly origin: any; // Use proper type from origins.S3Origin
}

export class WebsiteCloudFrontDistribution extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(
    scope: Construct,
    id: string,
    props: WebsiteCloudFrontDistributionProps,
  ) {
    super(scope, id);

    this.distribution = new cloudfront.Distribution(
      this,
      "WebsiteCloudFrontDistribution",
      {
        defaultBehavior: {
          origin: props.origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        domainNames: props.domainNames,
        certificate: props.certificate,
        defaultRootObject: "index.html",
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        httpVersion: cloudfront.HttpVersion.HTTP2,
        enableLogging: true,
      },
    );
  }
}

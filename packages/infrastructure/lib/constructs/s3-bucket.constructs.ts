import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { StageType } from "../../config/constants";

interface WebAppS3BucketConstructProps {
  readonly stageName: StageType;
}

export class WebAppS3BucketConstruct extends Construct {
  public readonly bucket: Bucket;

  constructor(
    scope: Construct,
    id: string,
    props: WebAppS3BucketConstructProps
  ) {
    super(scope, id);

    this.bucket = new Bucket(this, "HubWebAppBucket", {
      bucketName: `ehsan-hub-web-app-${props.stageName}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
}

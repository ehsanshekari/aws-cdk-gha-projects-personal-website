import {
  Stack,
  StackProps,
  CfnOutput,
  aws_apigateway as apigw,
  aws_lambda as lambda,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_route53 as route53,
  aws_route53_targets as targets,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class PrivateApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1. VPC
    const vpc = new ec2.Vpc(this, "CustomVpc", {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "private-subnet",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: "public-subnet",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      natGateways: 1,
    });

    // 2. Lambda
    const fn = new lambda.Function(this, "PrivateApiLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
        exports.handler = async () => {
          return {
            statusCode: 200,
            body: "Hello from Private Lambda!"
          };
        };
      `),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // 3. Interface VPC Endpoint for API Gateway
    const apiGatewayVpce = new ec2.InterfaceVpcEndpoint(this, "ApiGwVpce", {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
      privateDnsEnabled: true,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // 4. Private API Gateway
    const api = new apigw.RestApi(this, "PrivateApi", {
      restApiName: "PrivateApiGateway",
      endpointConfiguration: {
        types: [apigw.EndpointType.PRIVATE],
        vpcEndpoints: [apiGatewayVpce],
      },
      deployOptions: {
        stageName: "dev",
      },
    });

    // 5. Lambda Integration
    const integration = new apigw.LambdaIntegration(fn);
    const resource = api.root.addResource("hello");
    resource.addMethod("GET", integration);

    // 6. Resource Policy
    const apiGatewayRestApi = api.node.defaultChild as apigw.CfnRestApi;
    apiGatewayRestApi.policy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()],
          actions: ["execute-api:Invoke"],
          resources: ["execute-api:/*"],
          conditions: {
            StringEquals: {
              "aws:SourceVpce": apiGatewayVpce.vpcEndpointId,
            },
          },
        }),
      ],
    }).toJSON();

    // 7. Private Hosted Zone
    const hostedZone = new route53.PrivateHostedZone(
      this,
      "InternalHostedZone",
      {
        zoneName: "internal.com",
        vpc,
      }
    );

    // 8. DNS Record - point api.internal.com to VPC Endpoint DNS name
    new route53.CnameRecord(this, "PrivateApiCnameRecord", {
      zone: hostedZone,
      recordName: "api", // api.internal.com
      domainName: apiGatewayVpce.vpcEndpointDnsEntries[0],
      ttl: Duration.minutes(5),
    });

    // 9. Outputs
    new CfnOutput(this, "InvokeUrl", {
      value: `https://api.internal.com/dev/hello`,
      exportName: "PrivateApiInvokeUrl",
    });

    new CfnOutput(this, "VpcEndpointDns", {
      value: apiGatewayVpce.vpcEndpointDnsEntries[0],
    });
  }
}

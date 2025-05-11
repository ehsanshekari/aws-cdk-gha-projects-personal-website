import {
  Stack,
  StackProps,
  aws_apigateway as apigw,
  aws_lambda as lambda,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_route53 as route53,
  aws_route53_targets as targets,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class PrivateApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1. Get or create a VPC
    const vpc = ec2.Vpc.fromLookup(this, "Vpc", {
      isDefault: true, // Or change to your custom VPC
    });

    // 2. Lambda function inside the VPC (use PRIVATE_WITH_EGRESS subnets)
    const fn = new lambda.Function(this, "PrivateApiLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
        exports.handler = async () => {
          return {
            statusCode: 200,
            body: "Private Hello from Lambda"
          };
        };
      `),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // 3. Create Interface VPC Endpoint for API Gateway
    const apiGatewayVpce = new ec2.InterfaceVpcEndpoint(this, "ApiGwVpce", {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
      privateDnsEnabled: true,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // 4. Private REST API Gateway (NO policy on init)
    const api = new apigw.RestApi(this, "PrivateApi", {
      restApiName: "PrivateApiGateway",
      endpointConfiguration: {
        types: [apigw.EndpointType.PRIVATE],
        vpcEndpoints: [apiGatewayVpce],
      },
    });

    // 5. Lambda integration + route
    const integration = new apigw.LambdaIntegration(fn);
    const resource = api.root.addResource("hello");
    resource.addMethod("GET", integration);

    // 6. Add Resource Policy to restrict to the VPC Endpoint
    api.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ["execute-api:Invoke"],
        resources: [`${api.arnForExecuteApi()}/*`],
        conditions: {
          StringEquals: {
            "aws:SourceVpce": apiGatewayVpce.vpcEndpointId,
          },
        },
      })
    );

    // // 7. (Optional) Private DNS with Route53
    // const hostedZone = new route53.PrivateHostedZone(this, 'InternalHostedZone', {
    //   zoneName: 'internal.example.com',
    //   vpc,
    // });

    // new route53.ARecord(this, 'ApiAliasRecord', {
    //   zone: hostedZone,
    //   recordName: 'api.internal.example.com',
    //   target: route53.RecordTarget.fromAlias(new targets.ApiGateway(api)),
    // });
  }
}

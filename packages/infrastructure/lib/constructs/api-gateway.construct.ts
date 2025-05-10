import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";

import { V1RoutesConstruct } from "./v1-routes.construct";
import { StageType } from "../../config/constants";

interface ApiGatewayConstructProps {
  stageName: StageType;
  apis: {
    signUpLambda: lambda.IFunction;
    loginLambda: lambda.IFunction;
    logoutLambda: lambda.IFunction;
  };
  apiDomainName: string;
  certificate: ICertificate;
}

export class ApiGatewayConstruct extends Construct {
  public api: apigateway.RestApi;
  public apiDomain: string;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    this.createRestApi(props);
    this.createV1Resource(props);
    this.createUsagePlan();
  }

  private createRestApi(props: ApiGatewayConstructProps) {
    this.api = new apigateway.RestApi(this, "OriolaHubRestApi", {
      restApiName: "Oriola Hub API",
      description: "API for Oriola Hub application",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
        maxAge: cdk.Duration.days(1),
      },
      deployOptions: {
        stageName: props.stageName,
      },
    });

    const domain = new apigateway.DomainName(this, "OriolaHubDomain", {
      domainName: props.apiDomainName,
      certificate: props.certificate,
      endpointType: apigateway.EndpointType.REGIONAL,
    });

    this.apiDomain = domain.domainNameAliasDomainName;

    new apigateway.BasePathMapping(this, "BasePathMapping", {
      domainName: domain,
      restApi: this.api,
      stage: this.api.deploymentStage,
    });

    new cdk.CfnOutput(this, "OriolaHubApiUrl", {
      value: this.api.url,
      description: "AWS-provided URL of the Oriola Hub App API Gateway",
    });
  }

  private createV1Resource(props: ApiGatewayConstructProps) {
    const v1 = this.api.root.addResource("v1");

    new V1RoutesConstruct(this, "V1Routes", {
      parentResource: v1,
      signUpLambda: props.apis.signUpLambda,
      loginLambda: props.apis.loginLambda,
      logoutLambda: props.apis.logoutLambda,
    });
  }

  private createUsagePlan() {
    new apigateway.UsagePlan(this, "OriolaHubApiUsagePlan", {
      name: "OriolaHubApiUsagePlan",
      apiStages: [
        {
          api: this.api,
          stage: this.api.deploymentStage,
        },
      ],
      throttle: {
        rateLimit: 100,
        burstLimit: 10,
      },
    });
  }
}

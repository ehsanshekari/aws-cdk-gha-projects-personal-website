import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

interface V1RoutesConstructProps {
  parentResource: apigateway.IResource;
  signUpLambda: lambda.IFunction;
  loginLambda: lambda.IFunction;
  logoutLambda: lambda.IFunction;
}

export class V1RoutesConstruct extends Construct {
  constructor(scope: Construct, id: string, props: V1RoutesConstructProps) {
    super(scope, id);

    const users = props.parentResource.addResource("users");
    const sessions = props.parentResource.addResource("sessions");

    users.addMethod(
      "POST",
      new apigateway.LambdaIntegration(props.signUpLambda)
    );
    users.addMethod(
      "GET",
      new apigateway.LambdaIntegration(props.signUpLambda)
    );
    sessions.addMethod(
      "POST",
      new apigateway.LambdaIntegration(props.loginLambda)
    );
    sessions.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(props.logoutLambda)
    );
  }
}

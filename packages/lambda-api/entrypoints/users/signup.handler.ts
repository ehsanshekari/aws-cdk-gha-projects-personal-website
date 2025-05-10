import { APIGatewayProxyResult, APIGatewayProxyEvent } from "aws-lambda";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Placeholder for now
    console.log("Proxied signup call event: ", JSON.stringify(event, null, 2));

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Hello from signUpHandler!",
        input: event,
      }),
    };
  } catch (error) {
    console.error("Error in signUpHandler: ", error);
    throw error;
  }
}

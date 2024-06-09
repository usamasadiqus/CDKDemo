import * as cdk from "aws-cdk-lib";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export class CdkDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // DynamoDB

    const todoTable = new Table(this, "todo", {
      partitionKey: { name: "name", type: AttributeType.STRING },
    });

    // Lambda Functions
    const getAllTodosLambda = new Function(this, "GetAllTodosLambdaHandler", {
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset("functions"),
      handler: "get-all-todos.getAllTodosHandler",
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
      },
    });

    // Permissions lambda function to dynamo db
    todoTable.grantReadWriteData(getAllTodosLambda);

    // Lambda Functions
    const putTodoLambda = new Function(this, "PutTodoLambdaHandler", {
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset("functions"),
      handler: "put-todo.putTodoHandler",
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
      },
    });

    todoTable.grantReadWriteData(putTodoLambda);

    // Create the api gateway methods and path
    const api = new RestApi(this, "todo-api");
    api.root
      .resourceForPath("todo")
      .addMethod("GET", new LambdaIntegration(getAllTodosLambda));

    api.root
      .resourceForPath("todo")
      .addMethod("POST", new LambdaIntegration(putTodoLambda));

    new cdk.CfnOutput(this, "API URL", {
      value: api.url ?? "Something went wrong",
    });
  }
}

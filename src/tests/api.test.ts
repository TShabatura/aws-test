import axios from 'axios';
import { validate } from "jsonschema";
import awsController from '../api/aws.controller';
import { EC2 } from 'aws-sdk';
import cloudxinfoSchema from '../jsonSchemas/cloudxinfoSchema.json';

const API_ENDPOINT = 'http://ec2-52-59-146-252.eu-central-1.compute.amazonaws.com/';
const REGION = 'eu-central-1';
const publicInstanceId = 'i-083afea812d6c6808';
const accountId = '035825444739'

describe('Deployment validation', () => {

  let inctanceList: EC2.ReservationList;
  let privateInstance: EC2.Reservation;
  let publicInstance: EC2.Reservation;
  let publicVpcList: EC2.VpcList;
  let privateVpcList: EC2.VpcList;
  let publicVpcId: string;
  let privateVpcId: string;
  let privateInstanceSubnet: EC2.Subnet;
  let publicInstanceSubnet: EC2.Subnet;

  beforeAll(async() => {
    inctanceList = await awsController.getAllInstances(accountId);
    privateInstance = inctanceList[2];
    publicInstance = inctanceList[0];
    publicVpcId = await awsController.getVpcId(publicInstance);
    privateVpcId = await awsController.getVpcId(privateInstance);
    publicVpcList = await awsController.getVpcList(publicVpcId);
    privateVpcList = await awsController.getVpcList(privateVpcId);
    privateInstanceSubnet = await awsController.getSubnet(privateInstance.Instances[0].SubnetId);
    publicInstanceSubnet = await awsController.getSubnet(publicInstance.Instances[0].SubnetId);
  });

  test('Instance type validation', async () => {
    expect(await awsController.getInstanceType(publicInstance)).toBe("t2.micro");
    expect(await awsController.getInstanceType(privateInstance)).toBe("t2.micro");
  });

  test('Instance tags validation', async () => {
    expect(await awsController.getInstanceTag(publicInstance, "Name")).toBe("cloudxinfo/PublicInstance/Instance");
    expect(await awsController.getInstanceTag(privateInstance, "Name")).toBe("cloudxinfo/PrivateInstance/Instance");
    expect(await awsController.getInstanceTag(publicInstance, "cloudx")).toBe("qa");
    expect(await awsController.getInstanceTag(privateInstance, "cloudx")).toBe("qa");
  });

  test('Instance OS validation', async () => {
    expect(await awsController.getOS(publicInstance)).toBe("Linux/UNIX");
    expect(await awsController.getOS(privateInstance)).toBe("Linux/UNIX");
  });

  test('Instance publicIP validation', async () => {
    expect(await awsController.getPublicIP(publicInstance)).toBeDefined();
    expect(await awsController.getPublicIP(privateInstance)).toBeUndefined();
  });

  test('Instance VPC non-default validation', () => {
    expect(publicVpcList[0].IsDefault).toBe(false);
    expect(privateVpcList[0].IsDefault).toBe(false);
  });

  test('Private instance VPC subnet validation', async () => {
    expect(await awsController.getSubnetTag(privateInstanceSubnet, "aws-cdk:subnet-type")).toBe("Private");
  });

  test('Public instance VPC subnet validation', async () => {
    expect(await awsController.getSubnetTag(publicInstanceSubnet, "aws-cdk:subnet-type")).toBe("Public");
  });

  test('Private instance has NAT Gateway', async () => {
    expect(await awsController.hasNatGateway(await awsController.getRouteTable(privateInstanceSubnet.SubnetId)));
  });

  test('Public instance has Internet Gateway', async () => {
    expect(await awsController.hasInternetGateway(await awsController.getRouteTable(publicInstanceSubnet.SubnetId)));
  });

  test('Private instance VPC CIDR Block validation', async () => {
    expect(await awsController.getVpcCidrBlock(privateVpcList[0])).toBe("10.0.0.0/16");
  });

  test('Public instance VPC CIDR Block validation', async () => {
    expect(await awsController.getVpcCidrBlock(publicVpcList[0])).toBe("10.0.0.0/16");
  });

  test('Vpc tags validation', async () => {
    expect(await awsController.getVpcTag(publicVpcList[0], "Name")).toBe("cloudxinfo/Network/Vpc");
    expect(await awsController.getVpcTag(privateVpcList[0], "Name")).toBe("cloudxinfo/Network/Vpc");
    expect(await awsController.getVpcTag(publicVpcList[0], "cloudx")).toBe("qa");
    expect(await awsController.getVpcTag(privateVpcList[0], "cloudx")).toBe("qa");
  });
});

describe('Application functional validation', () => {
  test('EC2 instance attributes validation', async () => {
    const expectedAvailibilityZone = await awsController.getAvailabilityZone(publicInstanceId);
    const expectedPrivateIP = await awsController.getPrivateIP(publicInstanceId);
    
    let response = await axios.get(API_ENDPOINT);
    expect(response.status).toBe(200);

    let result = validate(response.data, cloudxinfoSchema);
    console.log(result.errors.toString());
    expect(result.valid).toBeTruthy();

    expect(response.data.availability_zone).toEqual(expectedAvailibilityZone);
    expect(response.data.private_ipv4).toEqual(expectedPrivateIP);
    expect(response.data.region).toEqual(REGION);
  })
})
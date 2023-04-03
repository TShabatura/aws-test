import axios from 'axios';
import { validate } from "jsonschema";
import awsController from '../api/aws.controller';
import { EC2 } from 'aws-sdk';
import cloudxinfoSchema from '../jsonSchemas/cloudxinfoSchema.json';

const API_ENDPOINT = 'http://ec2-3-124-190-77.eu-central-1.compute.amazonaws.com/';
const REGION = 'eu-central-1';
const instanceId = 'i-0eafe28032936d448';
const accountId = '035825444739'

describe('Deployment validation', () => {

  let inctanceList: EC2.ReservationList;
  let privateInstance: EC2.Reservation;
  let publicInstance: EC2.Reservation;

  beforeAll(async() => {
    inctanceList = await awsController.getAllInstances(accountId);
    privateInstance = inctanceList[1];
    publicInstance = inctanceList[0];
  });

  test('Instance type validation', async () => {
    expect(await awsController.getInstanceType(publicInstance)).toBe("t2.micro");
    expect(await awsController.getInstanceType(privateInstance)).toBe("t2.micro");
  });

  test('Instance tags validation', async () => {
    expect(await awsController.getInstanceTags(publicInstance, "Name")).toBe("cloudxinfo/PublicInstance/Instance");
    expect(await awsController.getInstanceTags(privateInstance, "Name")).toBe("cloudxinfo/PrivateInstance/Instance");
    expect(await awsController.getInstanceTags(publicInstance, "cloudx")).toBe("qa");
    expect(await awsController.getInstanceTags(privateInstance, "cloudx")).toBe("qa");
  });

  test('Instance OS validation', async () => {
    expect(await awsController.getOS(publicInstance)).toBe("Linux/UNIX");
    expect(await awsController.getOS(privateInstance)).toBe("Linux/UNIX");
  });
  
  test('Instance publicIP validation', async () => {
    expect(await awsController.getPublicIP(publicInstance)).toBeDefined();
    expect(await awsController.getPublicIP(privateInstance)).toBeUndefined();
  });
});

describe('Application functional validation', () => {
  test('EC2 instance attributes validation', async () => {
    const expectedAvailibilityZone = await awsController.getAvailabilityZone(instanceId);
    const expectedPrivateIP = await awsController.getPrivateIP(instanceId);
    
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
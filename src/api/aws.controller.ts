import { EC2 } from 'aws-sdk';

class AWSController{
    readonly REGION = 'eu-central-1';
    readonly ec2 = new EC2({ region: this.REGION });

    getAvailabilityZone = (instanceId: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const params = {
                InstanceIds: [instanceId],
            };
      
            this.ec2.describeInstances(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                const availabilityZone = data.Reservations?.[0].Instances?.[0].Placement?.AvailabilityZone;
                resolve(availabilityZone);
                }
            });
        });
    };

    getPrivateIP = (instanceId: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const params = {
                InstanceIds: [instanceId]
            };
        
            this.ec2.describeInstances(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    const privateIP = data.Reservations?.[0].Instances?.[0].PrivateIpAddress;
                    resolve(privateIP);
                }
            });
        });
    };

    getAllInstances = (accountId: string): Promise<EC2.ReservationList> => {
        return new Promise((resolve, reject) => {
          const params = {
            Filters: [
              {
                Name: 'owner-id',
                Values: [accountId],
              },
            ],
          };
      
          this.ec2.describeInstances(params, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data.Reservations);
            }
          });
        });
      };

    getVpcList = (vpcId: string): Promise<EC2.VpcList> => {
        return new Promise((resolve, reject) => {
          const params = {
            VpcIds: [vpcId],
          };
      
          this.ec2.describeVpcs(params, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data.Vpcs);
            }
          });
        });
    };

    getSubnet = (subnetId: string): Promise<EC2.Subnet> => {
        return new Promise((resolve, reject) => {
          const params = {
            SubnetIds: [subnetId]
          };
      
          this.ec2.describeSubnets(params, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data.Subnets[0]);
            }
          });
        });
    };

    getRouteTable = (subnetId: string): Promise<EC2.RouteTable> => {
        return new Promise((resolve, reject) => {
            const params = {
                Filters: [
                    {
                      Name: 'association.subnet-id',
                      Values: [subnetId],
                    },
                  ]
            };
        
            this.ec2.describeRouteTables(params, (err, data) => {
                if (err) {
                  console.log(err, err.stack);
                } else {
                    resolve(data.RouteTables[0]);
                }
            });
        });
    }

    getInstanceType = (reservation: EC2.Reservation): Promise<string> => {
        return new Promise((resolve) => {
            resolve(reservation.Instances[0].InstanceType);
        });
    };

    getInstanceTag = (reservation: EC2.Reservation, tag: string): Promise<string> => {
        return new Promise((resolve) => {
            resolve(reservation.Instances[0].Tags.find(obj => obj.Key === tag).Value);
        });
    };

    getOS = (reservation: EC2.Reservation): Promise<string> => {
        return new Promise((resolve) => {
            resolve(reservation.Instances[0].PlatformDetails);
        });
    };

    getPublicIP = (reservation: EC2.Reservation): Promise<string> => {
        return new Promise((resolve) => {
            resolve(reservation.Instances[0].PublicIpAddress);
        });
    };

    getVpcId = (reservation: EC2.Reservation): Promise<string> => {
        return new Promise((resolve) => {
            resolve(reservation.Instances[0].VpcId);
        });
    };

    getVpcCidrBlock = (vpc: EC2.Vpc): Promise<string> => {
        return new Promise((resolve) => {
            resolve(vpc.CidrBlock);
        });
    };
    
    getVpcTag = (vpc: EC2.Vpc, tag: string): Promise<string> => {
        return new Promise((resolve) => {
            resolve(vpc.Tags.find(obj => obj.Key === tag).Value);
        });
    };

    getSubnetTag = (vpc: EC2.Subnet, tag: string): Promise<string> => {
        return new Promise((resolve) => {
            resolve(vpc.Tags.find(obj => obj.Key === tag).Value);
        });
    };

    hasNatGateway = (routeTable: EC2.RouteTable): Promise<boolean> => {
        return new Promise(resolve => {
            resolve(routeTable.Routes[0].GatewayId.startsWith("nat-"));
        });
    }

    hasInternetGateway = (routeTable: EC2.RouteTable): Promise<boolean> => {
        return new Promise(resolve => {
            resolve(routeTable.Routes[0].GatewayId.startsWith("igw-"));
        });
    }
}

export default new AWSController();
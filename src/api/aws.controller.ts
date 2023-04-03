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

    getInstanceType = (reservation: EC2.Reservation): Promise<string> => {
        return new Promise((resolve) => {
            resolve(reservation.Instances[0].InstanceType);
        });
    };

    getInstanceTags = (reservation: EC2.Reservation, tag: string): Promise<string> => {
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
}

export default new AWSController();
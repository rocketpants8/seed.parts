# Seed.Parts

Seed.Parts is a simple web application that uses Shamir's Secret Sharing algorithm to split a secret into multiple parts. Each part can be stored in separate locations. The application allows you to reconstruct the secret by gathering a threshold number of parts.

## What It Does

Secrets provides a safe and user-friendly platform for:

1. **Secret Sharing**: Safely share secrets with others using Shamir's Secret Sharing algorithm. This allows you to split a secret into multiple parts, which can be distributed to different people or stored in separate locations.

2. **Secret Reconstruction**: Reconstruct your original secret by gathering a threshold number of parts. This ensures that your secret remains secure even if some parts are lost or compromised.

3. **Encryption**: It is recommended that you encrypt your secret before splitting it. Seed.Parts provides options for securely encrypting your secret using symmetric (password) or asymmetric (private/public key) encryption.

## What It Doesn't Do

1. **Transmit your secrets**: This application works entirely within your browser and client side. It does not collect or transmit any information.

2. **Storage**: This application does not provide any storage for your secrets or secret parts. You are responsible for storing the parts in secure locations.

## Why Use Seed.Parts?

- **Enhanced Security**: By splitting your secrets, you reduce the risk of unauthorized access.
- **Peace of Mind**: Know that your sensitive information is protected by advanced cryptographic techniques.
- **Collaboration**: Safely share confidential data with team members or trusted individuals.
- **Disaster Recovery**: Reconstruct your secrets even if some parts are lost, as long as you have the threshold number of parts.

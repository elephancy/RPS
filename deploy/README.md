# Production Release Contract

RPS production releases are owned by the private deployment controller. This
repository provides application CI and Docker build inputs. Build policy,
registry access, runtime values, routing, health gates, and rollback belong in
the controller.

## Automated release

The controller discovers the exact `main` commit after the required `CI` workflow
succeeds. This repository has no production release workflow, registry identity,
application deployment manifest, or deployment credentials. Review dependency and
application changes against the existing audit, lint, build, and backend gates.

## Runtime boundary

[`docker-compose.prod.yml`](docker-compose.prod.yml) and [`.env.example`](.env.example)
document application-level service and environment requirements. The private
controller owns the live service definition, injects runtime values, verifies the
release, and records signed deployment and rollback evidence.

Uploaded media remains persistent state and must never be replaced or pruned by
a code release. Database credentials, signing values, mail credentials, and other
runtime secrets belong only in the controller-managed runtime environment.

## Verification

Run `npm run test:deployment` to validate controller ownership, retained CI gates,
and the absence of application production publishing or direct-host hooks. CI
runs the same boundary check. Successful application CI and signed production
success are separate evidence.

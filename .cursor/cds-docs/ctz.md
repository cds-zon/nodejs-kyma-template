[![REUSE status](https://api.reuse.software/badge/github.com/SAP/ctz)](https://api.reuse.software/info/github.com/SAP/ctz)

# Containerize Build Tool

## About this project

Build tool to containerize cloud applications.

## Requirements

- [Docker](https://www.docker.com/get-started/)
- [Pack CLI (Only if you're using `buildpack` configuration)](https://buildpacks.io/docs/for-platform-operators/how-to/integrate-ci/pack/)

## Setup

## Usage

```bash
 USAGE
     ctz = ctz help
     ctz <filename> <options> = builds images of all modules and pushes them to remote repository
    
 OPTIONS
     -l |  --log       logs the standard output in the console
     -p |  --push      pushes the images to specified repository
     -h |  --help      get detailed usage information
     -v |  --version   get version of the package
     --repository      repository to push the images to
     --modules         list the modules image has to be built for

 EXAMPLES
    ctz build.yaml
    ctz build.yaml --log
    ctz build.yaml -l
    ctz build.yaml --push
    ctz build.yaml -p --log
    ctz build.yaml --modules=mod1,mod2
    ctz build.yaml --repository=docker.io/username
```

## Configuration

The following fields are allowed in the YAML file.

|        Field      |      Description                                             |     Mandatory           |
|-------------------|--------------------------------------------------------------|-------------------------|
| *_schema-version* | schema version of the containerize yaml file.                |                         |
| *repository*      | registry where your images/modules will be pushed.           | :ballot_box_with_check: |
| *tag*             | global tag used for all images/modules.                      |                         | 
| *before-all*      | list of commands to execute before building images/modules.  |                         |
| *modules*         | list of modules.                                             | :ballot_box_with_check: |

### Configuration of modules

There are three ways to configure how to containerize a module:

1. `buildpack`: Cloud Native buildpacks to containerize a module.
    
    Example:
      ```yaml
      modules:
      - name: bookshop-srv
        tag: v1
        build-parameters:
          buildpack:
            type: nodejs
            builder: builder-jammy-base
            path: gen/srv
            env:
              BP_NODE_RUN_SCRIPTS: ""
      ```

    **type** (optional): Mention the buildpack(s) (comma-separated if multiple).  
    There are certain keywords which when mentioned in `type` key of buildpack which are parsed as:  
   
    </br>
    

    |        Keyword    |      Parsed to                                               |
    |-------------------|--------------------------------------------------------------|
    | *nodejs*          | paketo-buildpacks/nodejs                              |                
    | *java*            | paketo-buildpacks/java                                |               
    | *sap-machine*     | paketo-buildpacks/sap-machine                         |
    | *executable-jar*  | paketo-buildpacks/executable-jar                      |
    | *spring-boot*     | paketo-buildpacks/spring-boot                         |
    | *syft*            | paketo-buildpacks/syft                                |
   
    </br>

    **builder**: Specify the builder type.  
    There are certain keywords which when mentioned in `builder` key of buildpack which are parsed as:  

    </br>


    |     Keyword                        |      Parsed to                                            |
    |------------------------------------|-----------------------------------------------------------|
    | *builder-jammy-base*               | paketobuildpacks/builder-jammy-base                       |
    | *builder-jammy-buildpackless-base* | paketobuildpacks/builder-jammy-buildpackless-base         |
    | *builder-jammy-full*               | paketobuildpacks/builder-jammy-full                       |
    | *builder-jammy-buildpackless-full* | paketobuildpacks/builder-jammy-buildpackless-full         |

    </br>

    **path** : Path of the module to be containerized.

    **env**: Environment variables (key-value pairs).

    `Note`: `pack` CLI tool is required for this option. 

2. `dockerfile`: Dockerfile provided by the user is used.

    Example:
    ```yaml
    modules:
    - name: bookshop-srv
      tag: latest
      build-parameters:
        dockerfile: <path to a docker file>
    ```

3. `commands`: List of commands provided by the user are executed to build the image.

    Example:
    ```yaml
    modules:
    - name: bookshop-srv
      build-parameters:
        commands:
        - command 1
        - command 2
        - command 3
    ```

    `Note`: These commands are executed as is without any validation.

## Support, Feedback, Contributing

This project is open to feature requests/suggestions, bug reports etc. via [GitHub issues](https://github.com/SAP/ctz/issues). Contribution and feedback are encouraged and always welcome. For more information about how to contribute, the project structure, as well as additional contribution information, see our [Contribution Guidelines](https://github.com/SAP/ctz/blob/main/CONTRIBUTING.md).

## Security / Disclosure
If you find any bug that may be a security problem, please follow our instructions at [in our security policy](https://github.com/SAP/ctz/security/policy) on how to report it. Please do not create GitHub issues for security-related doubts or problems.

## Code of Conduct

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone. By participating in this project, you agree to abide by its [Code of Conduct](https://github.com/SAP/.github/blob/main/CODE_OF_CONDUCT.md) at all times.

## Licensing

Copyright 2024 SAP SE or an SAP affiliate company and ctz contributors. Please see our [LICENSE](https://github.com/SAP/ctz/blob/main/LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/SAP/ctz).
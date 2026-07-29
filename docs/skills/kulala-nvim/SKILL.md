---
name: kulala-nvim
description: Create HTTP docs using kulala.nvim which is a Rest API client for neovim.
---

# Kulala Nvim Skill

Create HTTP docs using kulala.nvim which is a Rest API client for neovim.

## When to use

Use this skill when user need create or consume a http request like Postman but in neovim using `kulala.nvim`.

## How to use

When asked to edit code or write new code:

1. Learn about `kulala.nvim` using context7 if you need.
2. Create a route into `docs/http/[name].http` directory if its necessary.
3. Follow the kulala documentation for creating new endpoints.
4. Do use variables and make it reusable and maintainable.
5. Get more docs using the MCP context7 or fetching `https://neovim.getkulala.net/docs/usage` only if you need.

### Examples

```http
### Variables

@host=localhost:3000
@resource=properties

### GET_ALL_PROPERTIES

GET {{host}}/{{resource}} HTTP/1.1
Accept: application/json

###

### SAVE_PROPERTY

POST {{host}}/{{resource}} HTTP/1.1
Accept: application/json
Content-Type: application/json

{
  "name": "foo",
  "tokens": 10
}

###

### CACHE_PROPERTIES

POST {{host}}/{{resource}}/cache HTTP/1.1
Accept: application/json
Content-Type: application/json

{
  "properties": "{{GET_ALL_PROPERTIES.response.body.$.data}}",
}

###

### UPLOAD FILE

POST {{host}}/{{resource}} HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary{{$timestamp}}

------WebKitFormBoundary{{$timestamp}}
Content-Disposition: form-data; name="history"; filename="history.xlsx"
Content-Type: application/vnd.ms-excel

< /home/user/Downloads/history.xlsx
```

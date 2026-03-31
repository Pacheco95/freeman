# cURL Import Test Cases

## Working scenarios

### 1. Simple POST with JSON body

```
curl -X POST https://jsonplaceholder.typicode.com/posts -H "Content-Type: application/json" -d '{"title":"foo","body":"bar","userId":1}'
```

**Expect:** Method → `POST`, URL → `https://jsonplaceholder.typicode.com/posts`, Headers table populated with `Content-Type`, body filled with the JSON object.

---

### 2. PUT with JSON body and multiple headers

```
curl -X PUT https://jsonplaceholder.typicode.com/posts/1 -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.test" -d '{"id":1,"title":"updated title","body":"updated body","userId":1}'
```

**Expect:** Method → `PUT`, two headers rows (`Content-Type` and `Authorization`), body filled with the JSON object.

---

### 3. PATCH with JSON body

```
curl -X PATCH https://jsonplaceholder.typicode.com/posts/1 -H "Content-Type: application/json" -d '{"title":"patched title"}'
```

**Expect:** Method → `PATCH`, URL correct, single header, partial JSON body.

---

### 4. POST with query params and JSON body

```
curl -X POST "https://api.example.com/search?page=1&limit=20" -H "Content-Type: application/json" -H "X-Api-Key: abc123" -d '{"query":"test","filters":{"active":true}}'
```

**Expect:** URL without query string in the URL field, Params table populated with `page=1` and `limit=20`, two headers, nested JSON body.

---

### 5. DELETE with JSON body

```
curl -X DELETE https://api.example.com/items/42 -H "Authorization: Bearer token123" -H "Content-Type: application/json" -d '{"reason":"user requested removal"}'
```

**Expect:** Method → `DELETE`, one param-less URL, two headers, body filled.

---

### 6. Multiline JSON body (backslash continuation)

```
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "admin"
  }'
```

**Expect:** Same as scenario 1 but with a pretty-printed JSON body.

---

## Known limitations (these will throw an error on import)

### 7. GET request (no body)

```
curl https://jsonplaceholder.typicode.com/posts/1
```

**Expect error:** The parser throws `"Not implemented"` when there is no body — GET requests are not currently supported.

---

### 8. POST with form-data (`-F`)

```
curl -X POST https://api.example.com/upload -F "file=@photo.jpg" -F "caption=hello"
```

**Expect error:** `form-data` body type is not supported — throws `"Not implemented"`.

---

### 9. POST with URL-encoded body (`--data-urlencode`)

```
curl -X POST https://api.example.com/login --data-urlencode "username=john" --data-urlencode "password=secret"
```

**Expect error:** `x-www-form-urlencoded` body type is not supported — throws `"Not implemented"`.

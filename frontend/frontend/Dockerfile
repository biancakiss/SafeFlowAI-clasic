FROM node:22-alpine AS build

WORKDIR /frontend

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_MOCK_ENABLED=false

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_MOCK_ENABLED=$VITE_MOCK_ENABLED

RUN npm run build

FROM nginx:alpine

COPY --from=build /frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
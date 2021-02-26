FROM nginxinc/nginx-unprivileged:1.19-alpine

COPY ./docker/config/nginx/nginx-prod-with-load-balancer.conf /etc/nginx/nginx.conf

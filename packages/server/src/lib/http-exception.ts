import type {MaybeNull} from "@lindeneg/shared";

export const RESPONSE_MESSAGES = {
    malformedBody: "The requested action could not be exercised due to malformed syntax.",
    unauthorized:
        "The provided credentials are either invalid or has insufficient privilege to perform the requested action.",
    forbidden: "You do not have permission to perform this action.",
    notFound: "The requested resource could not be found.",
    illegalMethod: "The requested action is made using an illegal method.",
    unprocessable:
        "The request was well-formed but not honored. Perhaps the action trying to be performed has already been done?",
    internal: "Something went wrong. Please try again later.",
};

export class HttpException extends Error {
    private constructor(
        message: string,
        readonly statusCode: number,
        readonly details: MaybeNull<unknown> = null
    ) {
        super(message);

        this.statusCode = statusCode;
        this.details = details;
    }

    public toResponse() {
        if (this.details) {
            return {error: this.details, msg: this.message};
        }
        return {msg: this.message};
    }

    public static malformedBody(details?: unknown, message?: string) {
        return new HttpException(message ?? RESPONSE_MESSAGES.malformedBody, 400, details);
    }

    public static unauthorized(details?: unknown, message?: string) {
        return new HttpException(message ?? RESPONSE_MESSAGES.unauthorized, 401, details);
    }

    public static forbidden(details?: unknown, message?: string) {
        return new HttpException(message ?? RESPONSE_MESSAGES.forbidden, 403, details);
    }

    public static notFound(details?: unknown, message?: string) {
        return new HttpException(message || RESPONSE_MESSAGES.notFound, 404, details);
    }

    public static illegalMethod(details?: unknown, message?: string) {
        return new HttpException(message || RESPONSE_MESSAGES.illegalMethod, 405, details);
    }

    public static unprocessable(details?: unknown, message?: string) {
        return new HttpException(message || RESPONSE_MESSAGES.unprocessable, 422, details);
    }

    public static internal(details?: unknown, message?: string) {
        return new HttpException(message ?? RESPONSE_MESSAGES.internal, 500, details);
    }
}

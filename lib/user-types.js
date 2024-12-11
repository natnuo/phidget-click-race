"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUser = void 0;
const isUser = (obj) => {
    const _uobj = obj;
    return (typeof (_uobj === null || _uobj === void 0 ? void 0 : _uobj.username) === "string" &&
        typeof (_uobj === null || _uobj === void 0 ? void 0 : _uobj.email) === "string" &&
        ((_uobj === null || _uobj === void 0 ? void 0 : _uobj.type) === "clicker" || (_uobj === null || _uobj === void 0 ? void 0 : _uobj.type) === "reciever"));
};
exports.isUser = isUser;

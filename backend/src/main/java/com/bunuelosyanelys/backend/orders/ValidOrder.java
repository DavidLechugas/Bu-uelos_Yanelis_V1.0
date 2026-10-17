package com.bunuelosyanelys.backend.orders;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

/**
 * Un pedido a domicilio exige cliente, teléfono y dirección; una venta en el
 * local no. Los errores se reportan en el campo correspondiente.
 */
@Documented
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ValidOrder.Validator.class)
public @interface ValidOrder {

    String message() default "Datos del pedido no válidos.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<ValidOrder, OrderController.CreateOrderRequest> {

        @Override
        public boolean isValid(OrderController.CreateOrderRequest request, ConstraintValidatorContext context) {
            if (request.tipo() == OrderType.LOCAL) {
                return true;
            }
            context.disableDefaultConstraintViolation();
            boolean valid = true;
            valid &= require(context, request.cliente(), "cliente", "Escribe el nombre del cliente.");
            valid &= require(context, request.telefono(), "telefono", "Escribe el teléfono.");
            valid &= require(context, request.direccion(), "direccion", "Escribe la dirección.");
            return valid;
        }

        private static boolean require(ConstraintValidatorContext context, String value, String field, String message) {
            if (value != null && !value.isBlank()) {
                return true;
            }
            context.buildConstraintViolationWithTemplate(message).addPropertyNode(field).addConstraintViolation();
            return false;
        }
    }
}

-- ==============================================================================
-- ⭐ PARTIU MOBILIDADE — TRIGGER AUTOMÁTICO DE RECÁLCULO DE AVALIAÇÕES (RATINGS)
-- ==============================================================================
-- Migração Canônica: 20261009_recalculate_user_ratings_trigger.sql
-- Recalcula a nota média (1.00 a 5.00) de motoristas e passageiros a cada
-- inserção ou atualização na tabela ride_ratings e sincroniza nas tabelas de perfil.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_user_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_avg NUMERIC(3,2);
    v_count INTEGER;
BEGIN
    -- 1. Calcula a média aritmética e total de avaliações do usuário avaliado (to_user_id)
    SELECT 
        ROUND(COALESCE(AVG(score), 5.00)::numeric, 2), 
        COUNT(*)
    INTO v_avg, v_count
    FROM public.ride_ratings
    WHERE to_user_id = NEW.to_user_id;

    -- Se houver média calculada, sincroniza nas tabelas correspondentes
    IF v_avg IS NOT NULL THEN
        -- Atualiza tabela global profiles se existir
        BEGIN
            UPDATE public.profiles
            SET rating = v_avg,
                updated_at = now()
            WHERE id::text = NEW.to_user_id;
        EXCEPTION WHEN OTHERS THEN
            -- Ignora caso a coluna ou tabela profiles tenha schema divergente
            NULL;
        END;

        -- Se a avaliação foi de um motorista para um passageiro, atualiza partiu_passageiros
        IF NEW.role = 'DRIVER_TO_PASSENGER' THEN
            BEGIN
                UPDATE public.partiu_passageiros
                SET rating = v_avg,
                    updated_at = now()
                WHERE user_id = NEW.to_user_id OR id::text = NEW.to_user_id;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;

        -- Se a avaliação foi de um passageiro para um motorista, atualiza partiu_motoristas
        IF NEW.role = 'PASSENGER_TO_DRIVER' THEN
            BEGIN
                UPDATE public.partiu_motoristas
                SET rating = v_avg,
                    updated_at = now()
                WHERE user_id = NEW.to_user_id OR id::text = NEW.to_user_id;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criação do trigger na tabela ride_ratings
DROP TRIGGER IF EXISTS trg_recalculate_user_rating ON public.ride_ratings;
CREATE TRIGGER trg_recalculate_user_rating
AFTER INSERT OR UPDATE ON public.ride_ratings
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_user_rating();

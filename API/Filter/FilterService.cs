using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Linq.Expressions;

namespace Asha2 .0 . Filter {
    public static class FilterService<TEntity>
    {
        public static IQueryable<TEntity> ApplyFilter<TEntity>(IQueryable<TEntity> query, List<FilterCriteria> filters, string searchTerm)
        {
            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = ApplyContainsSearch(query, searchTerm);
            }

            if (filters == null || filters.Count == 0)
            {
                return query;
            }

            var parameter = Expression.Parameter(typeof(TEntity), "x");
            Expression combinedFilter = null;
            int i = 0;
            foreach (var filter in filters)
            {
                var property = Expression.Property(parameter, filter.PropertyName);
                var constant = Expression.Constant(Convert.ChangeType(filter.Value, property.Type));
                var individualFilter = GetFilterExpression(property, constant, filter.Operator);
                if (combinedFilter == null)
                {
                    combinedFilter = individualFilter;
                }
                else
                {
                    if (filter.PropertyName == filters[i-1].PropertyName)
                    {
                        combinedFilter = Expression.OrElse(combinedFilter, individualFilter);
                    }
                    else
                    {
                        combinedFilter = Expression.AndAlso(combinedFilter, individualFilter);
                    }
                }

                i++;
            }

            if (combinedFilter != null)
            {
                var lambda = Expression.Lambda<Func<TEntity, bool>>(combinedFilter, parameter);
                query = query.Where(lambda);
            }

            return query;
        }

        private static Expression GetFilterExpression(Expression property, ConstantExpression constant, string op)
        {
            switch (op.ToLower())
            {
                case "equals":
                case "=":
                    return Expression.Equal(property, constant);
                case "notequals":
                case "!=":
                    return Expression.NotEqual(property, constant);
                case "greaterthan":
                case ">":
                    return Expression.GreaterThan(property, constant);
                case "greaterthanorequal":
                case ">=":
                    return Expression.GreaterThanOrEqual(property, constant);
                case "lessthan":
                case "<":
                    return Expression.LessThan(property, constant);
                case "lessthanorequal":
                case "<=":
                    return Expression.LessThanOrEqual(property, constant);
                case "default":
                    throw new NotSupportedException ( $"Operator {op} is not supported." );
            }

            return Expression.Constant(false);
        }

        private static IQueryable<TEntity> ApplyContainsSearch<TEntity>(IQueryable<TEntity> query, string searchTerm)
        {
            IEnumerable<string> stringProperties =  GetStringProperties();
            ParameterExpression parameter =  Expression.Parameter(typeof(TEntity), "x");
            Expression combinedExpression = null;
            foreach (var property in stringProperties)
            {
                Expression propertyExpression = Expression.Property(parameter, property);
                Expression searchTermExpression = Expression.Constant(searchTerm);
                MethodInfo method = typeof(string).GetMethod("Contains", new[] { typeof(string) });
                MethodCallExpression methodCall = Expression.Call(propertyExpression, method, searchTermExpression);
                if (combinedExpression == null)
                {
                    combinedExpression = methodCall;
                }
                else
                {
                    combinedExpression = Expression.OrElse(combinedExpression, methodCall);
                }
            }

             Expression<Func<TEntity, bool>> lambda = Expression.Lambda<Func<TEntity, bool>>(combinedExpression, parameter);
            return query.Where(lambda);
        }

        private static IEnumerable<string> GetStringProperties()
        {
            var entityType = typeof(TEntity);
            var stringProperties = entityType.GetProperties().Where(p => p.PropertyType == typeof(string)).Select(p => p.Name);
            return stringProperties;
        }
    }
}
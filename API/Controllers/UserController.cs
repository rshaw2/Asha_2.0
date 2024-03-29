using Microsoft.AspNetCore.Mvc;
using Asha2.0.Models;
using Asha2.0.Data;
using Asha2.0.Filter;
using Asha2.0.Entities;
using Asha2.0.Authorization;
using Microsoft.AspNetCore.Authorization;

namespace Asha2.0.Controllers{
    /// <summary>
    /// Controller responsible for managing user-related operations in the API.
    /// </summary>
    /// <remarks>
    /// This controller provides endpoints for adding, retrieving, updating, and deleting user information.
    /// </remarks>
    [Route("api/user")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly Asha2.0Context_context;

        public UserController(Asha2.0Contextcontext)
        {
            _context = context;
        }

        /// <summary>Adds a new user to the database</summary>
        /// <param name="model">The user data to be added</param>
        /// <returns>The result of the operation</returns>
        [HttpPost]
        [UserAuthorize("User",Entitlements.Create)]
        public IActionResult Post([FromBody] User model)
        {
            _context.User.Add(model);
            var returnData = this._context.SaveChanges();
            return Ok(returnData);
        }

        /// <summary>Retrieves a list of users based on specified filters</summary>
        /// <param name="filters">The filter criteria in JSON format. Use the following format: [{"PropertyName": "PropertyName", "Operator": "Equal", "Value": "FilterValue"}] </param>
        /// <returns>The filtered list of users</returns>
        [HttpGet]
        [UserAuthorize("User",Entitlements.Read)]
        public IActionResult Get([FromQuery] string filters)
        {
            List<FilterCriteria> filterCriteria = null;
            if (!string.IsNullOrEmpty(filters))
            {
                filterCriteria = JsonHelper.Deserialize<List<FilterCriteria>>(filters);
            }

            var query = _context.User.IncludeRelated().AsQueryable();
            var result = FilterService<User>.ApplyFilter(query, filterCriteria);
            return Ok(result);
        }

        /// <summary>Retrieves a specific user by its primary key</summary>
        /// <param name="entityId">The primary key of the user</param>
        /// <returns>The user data</returns>
        [HttpGet]
        [Route("{id:Guid}")]
        [UserAuthorize("User",Entitlements.Read)]
        public IActionResult GetById([FromRoute] Guid id)
        {
            var entityData = _context.User.IncludeRelated().FirstOrDefault(entity => entity.Id == id);
            return Ok(entityData);
        }

        /// <summary>Deletes a specific user by its primary key</summary>
        /// <param name="entityId">The primary key of the user</param>
        /// <returns>The result of the operation</returns>
        [HttpDelete]
        [UserAuthorize("User",Entitlements.Delete)]
        [Route("{id:Guid}")]
        public IActionResult DeleteById([FromRoute] Guid id)
        {
            var entityData = _context.User.IncludeRelated().FirstOrDefault(entity => entity.Id == id);
            if (entityData == null)
            {
                return NotFound();
            }

            _context.User.Remove(entityData);
            var returnData = this._context.SaveChanges();
            return Ok(returnData);
        }

        /// <summary>Updates a specific user by its primary key</summary>
        /// <param name="entityId">The primary key of the user</param>
        /// <param name="updatedEntity">The user data to be updated</param>
        /// <returns>The result of the operation</returns>
        [HttpPut]
        [UserAuthorize("User",Entitlements.Update)]
        [Route("{id:Guid}")]
        public IActionResult UpdateById(Guid id, [FromBody] User updatedEntity)
        {
            if (id != updatedEntity.Id)
            {
                return BadRequest("Mismatched Id");
            }

            this._context.User.Update(updatedEntity);
            var returnData = this._context.SaveChanges();
            return Ok(returnData);
        }
    }
}